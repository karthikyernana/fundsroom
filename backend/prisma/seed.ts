import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean slate ────────────────────────────────────────────────────────────
  await prisma.challan_items.deleteMany();
  await prisma.challans.deleteMany();
  await prisma.stock_movements.deleteMany();
  await prisma.customer_notes.deleteMany();
  await prisma.products.deleteMany();
  await prisma.customers.deleteMany();
  await prisma.users.deleteMany();

  // ─── Users — one per role ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.users.create({
    data: {
      name: 'Admin User',
      email: 'admin@fundsroom.com',
      password_hash: passwordHash,
      role: 'admin',
    },
  });

  const sales = await prisma.users.create({
    data: {
      name: 'Sales User',
      email: 'sales@fundsroom.com',
      password_hash: passwordHash,
      role: 'sales',
    },
  });

  const sales2 = await prisma.users.create({
    data: {
      name: 'Ananya Sharma (Sales Rep)',
      email: 'sales2@fundsroom.com',
      password_hash: passwordHash,
      role: 'sales',
    },
  });

  const warehouse = await prisma.users.create({
    data: {
      name: 'Warehouse User',
      email: 'warehouse@fundsroom.com',
      password_hash: passwordHash,
      role: 'warehouse',
    },
  });

  await prisma.users.create({
    data: {
      name: 'Accounts User',
      email: 'accounts@fundsroom.com',
      password_hash: passwordHash,
      role: 'accounts',
    },
  });

  console.log('✅ Users created');

  // ─── Customers ──────────────────────────────────────────────────────────────
  const customer1 = await prisma.customers.create({
    data: {
      name: 'Ramesh Patel',
      mobile: '9876543210',
      email: 'ramesh@pateltraders.com',
      business_name: 'Patel Traders Pvt Ltd',
      gst_number: '27AABCP1234A1Z5',
      customer_type: 'wholesale',
      address: '45 Market Road, Pune, Maharashtra 411001',
      status: 'active',
      follow_up_date: new Date('2026-08-15'),
      assigned_to: sales.id,
    },
  });

  const customer2 = await prisma.customers.create({
    data: {
      name: 'Sunita Mehta',
      mobile: '9765432109',
      email: 'sunita@mehraenterprises.com',
      business_name: 'Mehra Enterprises',
      gst_number: '07AAHCM5678B1Z3',
      customer_type: 'distributor',
      address: '12 Industrial Area, Delhi 110020',
      status: 'active',
      assigned_to: sales.id,
    },
  });

  await prisma.customers.create({
    data: {
      name: 'Arun Kumar',
      mobile: '9654321098',
      business_name: 'Kumar Retail Stores',
      customer_type: 'retail',
      address: '78 Gandhi Nagar, Bangalore 560032',
      status: 'lead',
      follow_up_date: new Date('2026-08-20'),
      assigned_to: sales2.id,
    },
  });

  await prisma.customers.create({
    data: {
      name: 'Priya Sharma',
      mobile: '9543210987',
      email: 'priya@sharmadist.com',
      business_name: 'Sharma Distributors',
      gst_number: '06AAXPS9012C1Z1',
      customer_type: 'distributor',
      address: '33 Nehru Place, Delhi 110019',
      status: 'inactive',
      assigned_to: sales2.id,
    },
  });

  await prisma.customers.create({
    data: {
      name: 'Vikram Singh',
      mobile: '9432109876',
      email: 'vikram@singh.com',
      business_name: 'Singh Wholesale',
      customer_type: 'wholesale',
      address: '5 Ring Road, Jaipur, Rajasthan 302001',
      status: 'active',
      assigned_to: sales.id,
    },
  });

  console.log('✅ Customers created');

  // ─── Customer notes ──────────────────────────────────────────────────────────
  await prisma.customer_notes.createMany({
    data: [
      {
        customer_id: customer1.id,
        note: 'Called regarding bulk order of industrial products. Very interested.',
        created_by: sales.id,
      },
      {
        customer_id: customer1.id,
        note: 'Visited office. Confirmed Q3 requirements — estimate 500 units.',
        created_by: sales.id,
      },
      {
        customer_id: customer2.id,
        note: 'New distributor onboarded. First trial order dispatched.',
        created_by: admin.id,
      },
    ],
  });

  console.log('✅ Customer notes created');

  // ─── Products ────────────────────────────────────────────────────────────────
  const product1 = await prisma.products.create({
    data: {
      name: 'Industrial Bearing 6205',
      sku: 'BRG-6205-STD',
      category: 'Bearings',
      unit_price: 245.00,
      current_stock: 150,
      min_stock_alert: 20,
      location: 'Rack A-12',
    },
  });

  const product2 = await prisma.products.create({
    data: {
      name: 'Hydraulic Oil 68',
      sku: 'OIL-HYD-68-20L',
      category: 'Lubricants',
      unit_price: 1850.00,
      current_stock: 8,
      min_stock_alert: 15,
      location: 'Zone B-3',
    },
  });

  await prisma.products.create({
    data: {
      name: 'V-Belt A40',
      sku: 'BELT-VA40-STD',
      category: 'Drive Belts',
      unit_price: 180.00,
      current_stock: 75,
      min_stock_alert: 10,
      location: 'Rack C-7',
    },
  });

  await prisma.products.create({
    data: {
      name: 'Gear Oil 90',
      sku: 'OIL-GEAR-90-5L',
      category: 'Lubricants',
      unit_price: 620.00,
      current_stock: 32,
      min_stock_alert: 10,
      location: 'Zone B-5',
    },
  });

  await prisma.products.create({
    data: {
      name: 'Shaft Coupling 25mm',
      sku: 'CPL-SHAFT-25MM',
      category: 'Couplings',
      unit_price: 890.00,
      current_stock: 45,
      min_stock_alert: 5,
      location: 'Rack D-2',
    },
  });

  console.log('✅ Products created');

  // ─── Stock movements ─────────────────────────────────────────────────────────
  await prisma.stock_movements.createMany({
    data: [
      {
        product_id: product1.id,
        quantity_changed: 150,
        movement_type: 'IN',
        reason: 'Initial stock',
        created_by: warehouse.id,
      },
      {
        product_id: product2.id,
        quantity_changed: 20,
        movement_type: 'IN',
        reason: 'Initial stock',
        created_by: warehouse.id,
      },
      {
        product_id: product2.id,
        quantity_changed: 12,
        movement_type: 'OUT',
        reason: 'Challan CH-20260801-0001',
        created_by: warehouse.id,
      },
    ],
  });

  console.log('✅ Stock movements created');

  console.log('\n🎉 Seed complete! Test credentials:');
  console.log('  admin@fundsroom.com     / password123');
  console.log('  sales@fundsroom.com     / password123');
  console.log('  warehouse@fundsroom.com / password123');
  console.log('  accounts@fundsroom.com  / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
