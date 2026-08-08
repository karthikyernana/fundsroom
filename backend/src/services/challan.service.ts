import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChallanItem {
  product_id: string;
  quantity: number;
}

interface CreateChallanInput {
  customer_id: string;
  items: ChallanItem[];
}

interface ChallanQuery {
  status?: 'draft' | 'confirmed' | 'cancelled';
  customer?: string;
  page?: number;
  limit?: number;
}

// ─── Challan number generation ────────────────────────────────────────────────

async function generateChallanNumber(): Promise<string> {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  const prefix = `CH-${datePart}-`;
  const latest = await prisma.challans.findFirst({
    where: { challan_number: { startsWith: prefix } },
    orderBy: { challan_number: 'desc' },
    select: { challan_number: true },
  });

  let seqNum = 1;
  if (latest) {
    const parts = latest.challan_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seqNum = lastSeq + 1;
  }

  const seq = String(seqNum).padStart(4, '0');
  return `${prefix}${seq}`;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listChallans(query: ChallanQuery) {
  const { status, customer, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.challansWhereInput = {};

  if (status) where.status = status;
  if (customer) {
    where.customer = {
      OR: [
        { name: { contains: customer, mode: 'insensitive' } },
        { business_name: { contains: customer, mode: 'insensitive' } },
      ],
    };
  }

  const [challans, total] = await Promise.all([
    prisma.challans.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { id: true, name: true, business_name: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { challan_items: true } },
      },
    }),
    prisma.challans.count({ where }),
  ]);

  return {
    data: challans,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getChallan(id: string) {
  const challan = await prisma.challans.findUnique({
    where: { id },
    include: {
      customer: true,
      creator: { select: { id: true, name: true, role: true } },
      challan_items: {
        include: { product: { select: { id: true, current_stock: true } } },
      },
    },
  });

  if (!challan) throw new AppError(404, 'Challan not found');
  return challan;
}

// ─── Create (draft) ───────────────────────────────────────────────────────────

export async function createChallan(data: CreateChallanInput, userId: string) {
  const { customer_id, items } = data;

  if (items.length === 0) {
    throw new AppError(400, 'Challan must have at least one line item');
  }

  // Consolidate duplicate line items for same product_id
  const itemMap = new Map<string, number>();
  for (const item of items) {
    if (item.quantity <= 0) continue;
    itemMap.set(item.product_id, (itemMap.get(item.product_id) ?? 0) + item.quantity);
  }

  const consolidatedItems = Array.from(itemMap.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));

  if (consolidatedItems.length === 0) {
    throw new AppError(400, 'Line items must have positive quantities');
  }

  // Verify customer exists
  const customer = await prisma.customers.findUnique({ where: { id: customer_id } });
  if (!customer) throw new AppError(404, 'Customer not found');

  // Fetch products for snapshot data
  const productIds = consolidatedItems.map((i) => i.product_id);
  const products = await prisma.products.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    const foundIds = products.map((p) => p.id);
    const missing = productIds.filter((id) => !foundIds.includes(id));
    throw new AppError(404, `Products not found: ${missing.join(', ')}`);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const challanNumber = await generateChallanNumber();
  const totalQuantity = consolidatedItems.reduce((sum, i) => sum + i.quantity, 0);

  const challan = await prisma.challans.create({
    data: {
      challan_number: challanNumber,
      customer_id,
      status: 'draft',
      total_quantity: totalQuantity,
      created_by: userId,
      challan_items: {
        create: consolidatedItems.map((item) => {
          const product = productMap.get(item.product_id)!;
          return {
            product_id: item.product_id,
            // Snapshot values — frozen at creation time per §4
            product_name_snapshot: product.name,
            product_sku_snapshot: product.sku,
            unit_price_snapshot: product.unit_price,
            quantity: item.quantity,
            subtotal: product.unit_price.toNumber() * item.quantity,
          };
        }),
      },
    },
    include: {
      customer: { select: { id: true, name: true, business_name: true } },
      challan_items: true,
    },
  });

  return challan;
}

// ─── Update (draft only) ──────────────────────────────────────────────────────

export async function updateChallan(
  id: string,
  data: Partial<CreateChallanInput>
) {
  const existing = await prisma.challans.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Challan not found');
  if (existing.status !== 'draft') {
    throw new AppError(400, `Cannot edit a challan that is ${existing.status}`);
  }

  const { customer_id, items } = data;

  // Build update payload
  const updateData: Parameters<typeof prisma.challans.update>[0]['data'] = {};
  if (customer_id) {
    const customer = await prisma.customers.findUnique({ where: { id: customer_id } });
    if (!customer) throw new AppError(404, 'Customer not found');
    updateData.customer_id = customer_id;
  }

  if (items && items.length > 0) {
    const itemMap = new Map<string, number>();
    for (const item of items) {
      if (item.quantity <= 0) continue;
      itemMap.set(item.product_id, (itemMap.get(item.product_id) ?? 0) + item.quantity);
    }
    const consolidatedItems = Array.from(itemMap.entries()).map(([product_id, quantity]) => ({
      product_id,
      quantity,
    }));

    if (consolidatedItems.length === 0) {
      throw new AppError(400, 'Challan must have at least one valid line item');
    }

    const productIds = consolidatedItems.map((i) => i.product_id);
    const products = await prisma.products.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missing = productIds.filter((pid) => !foundIds.includes(pid));
      throw new AppError(404, `Products not found: ${missing.join(', ')}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    updateData.total_quantity = consolidatedItems.reduce((sum, i) => sum + i.quantity, 0);
    updateData.challan_items = {
      deleteMany: {},
      create: consolidatedItems.map((item) => {
        const product = productMap.get(item.product_id)!;
        return {
          product_id: item.product_id,
          product_name_snapshot: product.name,
          product_sku_snapshot: product.sku,
          unit_price_snapshot: product.unit_price,
          quantity: item.quantity,
          subtotal: product.unit_price.toNumber() * item.quantity,
        };
      }),
    };
  }

  return prisma.challans.update({
    where: { id },
    data: updateData,
    include: { challan_items: true, customer: true },
  });
}

// ─── Confirm (the §5 critical transaction) ────────────────────────────────────
//
// CORRECTNESS GUARANTEE:
// Stock deduction uses a single atomic SQL statement per item:
//   UPDATE products SET current_stock = current_stock - qty
//   WHERE id = ? AND current_stock >= qty
//
// $executeRaw returns the number of rows affected.
//   - 1 → stock was sufficient; check and decrement happened atomically.
//   - 0 → current_stock < qty at the moment the DB executed the statement.
//
// This eliminates the TOCTOU race that a two-step findUnique() + update()
// pattern would have. Two concurrent confirmations cannot both pass and then
// both decrement — the second one's WHERE clause will evaluate against the
// already-decremented value and return 0 rows affected.
//
// A PostgreSQL CHECK (current_stock >= 0) constraint (added via migration)
// acts as a structural backstop at the database level.

export async function confirmChallan(id: string, userId: string) {
  const challan = await prisma.challans.findUnique({
    where: { id },
    include: { challan_items: true },
  });

  if (!challan) throw new AppError(404, 'Challan not found');
  if (challan.status === 'confirmed') {
    throw new AppError(400, 'Challan is already confirmed');
  }
  if (challan.status === 'cancelled') {
    throw new AppError(400, 'Cannot confirm a cancelled challan');
  }
  if (challan.challan_items.length === 0) {
    throw new AppError(400, 'Cannot confirm an empty challan');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of challan.challan_items) {
      // Single atomic statement: condition + write in one round trip.
      // No lock needed separately — the WHERE clause makes it safe.
      const affected = await tx.$executeRaw`
        UPDATE "products"
        SET    "current_stock" = "current_stock" - ${item.quantity},
               "updated_at"   = NOW()
        WHERE  "id"            = ${item.product_id}
        AND    "current_stock" >= ${item.quantity}
      `;

      if (affected === 0) {
        // Stock was insufficient. Fetch current stock only for the error message.
        const product = await tx.products.findUnique({
          where: { id: item.product_id },
          select: { name: true, sku: true, current_stock: true },
        });
        throw new AppError(
          409,
          `Insufficient stock for "${product?.name ?? item.product_sku_snapshot}" ` +
          `(SKU: ${product?.sku ?? item.product_sku_snapshot}): ` +
          `available ${product?.current_stock ?? 0}, requested ${item.quantity}`
        );
      }

      // Record the OUT movement
      await tx.stock_movements.create({
        data: {
          product_id: item.product_id,
          quantity_changed: item.quantity,
          movement_type: 'OUT',
          reason: `Challan ${challan.challan_number}`,
          created_by: userId,
        },
      });
    }

    // Flip challan to confirmed
    await tx.challans.update({
      where: { id },
      data: { status: 'confirmed' },
    });
  });

  return prisma.challans.findUnique({
    where: { id },
    include: {
      customer: true,
      challan_items: true,
      creator: { select: { id: true, name: true } },
    },
  });
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelChallan(id: string) {
  const challan = await prisma.challans.findUnique({ where: { id } });
  if (!challan) throw new AppError(404, 'Challan not found');
  if (challan.status === 'confirmed') {
    throw new AppError(400, 'Cannot cancel a confirmed challan — contact admin');
  }
  if (challan.status === 'cancelled') {
    throw new AppError(400, 'Challan is already cancelled');
  }

  return prisma.challans.update({
    where: { id },
    data: { status: 'cancelled' },
    include: { customer: true, challan_items: true },
  });
}
