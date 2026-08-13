import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  AddNoteInput,
  CustomerQuery,
} from '../validators/customer.schema';

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listCustomers(query: CustomerQuery, currentUserId?: string) {
  const { search, status, assigned_to, my_customers, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.customersWhereInput = {};
  if (status) where.status = status;
  if (my_customers && currentUserId) {
    where.assigned_to = currentUserId;
  } else if (assigned_to) {
    where.assigned_to = assigned_to;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { business_name: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { gst_number: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customers.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        business_name: true,
        customer_type: true,
        status: true,
        follow_up_date: true,
        assigned_to: true,
        assigned_salesperson: { select: { id: true, name: true, email: true } },
        created_at: true,
        updated_at: true,
        _count: { select: { customer_notes: true, challans: true } },
      },
    }),
    prisma.customers.count({ where }),
  ]);

  return {
    data: customers,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getCustomer(id: string) {
  const customer = await prisma.customers.findUnique({
    where: { id },
    include: {
      assigned_salesperson: { select: { id: true, name: true, email: true } },
      customer_notes: {
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      _count: { select: { challans: true } },
    },
  });

  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCustomer(data: CreateCustomerInput) {
  await validateAssignedSalesperson(data.assigned_to);

  // Normalise optional empties to null/undefined
  const createData: Prisma.customersCreateInput = {
    name: data.name,
    mobile: data.mobile,
    email: data.email || undefined,
    business_name: data.business_name || undefined,
    gst_number: data.gst_number || undefined,
    customer_type: data.customer_type,
    address: data.address,
    status: data.status ?? 'lead',
    follow_up_date: data.follow_up_date ? new Date(data.follow_up_date) : undefined,
    notes: data.notes || undefined,
    assigned_salesperson: data.assigned_to ? { connect: { id: data.assigned_to } } : undefined,
  };

  return prisma.customers.create({
    data: createData,
    include: { assigned_salesperson: { select: { id: true, name: true, email: true } } },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const existing = await prisma.customers.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Customer not found');

  if (data.assigned_to !== undefined) {
    await validateAssignedSalesperson(data.assigned_to);
  }

  const updateData: Prisma.customersUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.mobile !== undefined) updateData.mobile = data.mobile;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.business_name !== undefined) updateData.business_name = data.business_name || null;
  if (data.gst_number !== undefined) updateData.gst_number = data.gst_number || null;
  if (data.customer_type !== undefined) updateData.customer_type = data.customer_type;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.follow_up_date !== undefined) {
    updateData.follow_up_date = data.follow_up_date ? new Date(data.follow_up_date) : null;
  }
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.assigned_to !== undefined) {
    updateData.assigned_salesperson = data.assigned_to ? { connect: { id: data.assigned_to } } : { disconnect: true };
  }

  return prisma.customers.update({
    where: { id },
    data: updateData,
    include: { assigned_salesperson: { select: { id: true, name: true, email: true } } },
  });
}

async function validateAssignedSalesperson(assignedTo: string | null | undefined) {
  if (!assignedTo) return;

  const assignee = await prisma.users.findUnique({
    where: { id: assignedTo },
    select: { role: true },
  });

  if (!assignee) throw new AppError(404, 'Assigned salesperson not found');
  if (assignee.role !== 'sales' && assignee.role !== 'admin') {
    throw new AppError(400, 'Customers can only be assigned to an admin or sales user');
  }
}

// ─── Add note ─────────────────────────────────────────────────────────────────

export async function addCustomerNote(
  customerId: string,
  data: AddNoteInput,
  createdBy: string
) {
  const customer = await prisma.customers.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError(404, 'Customer not found');

  return prisma.customer_notes.create({
    data: {
      customer_id: customerId,
      note: data.note,
      created_by: createdBy,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });
}
