/**
 * FundsRoom Backend — Comprehensive Integration Test Suite
 * Covers: Auth, Customers, Products, Challans
 * Run: cd backend && npx jest
 */

import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

let adminToken: string;
let salesToken: string;
let warehouseToken: string;
let accountsToken: string;
let customerId: string;
let productId: string;
let challanId: string;

const hash = bcrypt.hashSync('TestPass123!', 10);

beforeAll(async () => {
  await prisma.challan_items.deleteMany({});
  await prisma.challans.deleteMany({});
  await prisma.stock_movements.deleteMany({});
  await prisma.customer_notes.deleteMany({});
  await prisma.customers.deleteMany({});
  await prisma.products.deleteMany({});
  await prisma.users.deleteMany({});

  await prisma.users.createMany({
    data: [
      { name: 'Test Admin',     email: 'admin@test.com',     password_hash: hash, role: 'admin' },
      { name: 'Test Sales',     email: 'sales@test.com',     password_hash: hash, role: 'sales' },
      { name: 'Test Warehouse', email: 'warehouse@test.com', password_hash: hash, role: 'warehouse' },
      { name: 'Test Accounts',  email: 'accounts@test.com',  password_hash: hash, role: 'accounts' },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── 1. AUTH ────────────────────────────────────────────────────────────────
describe('POST /auth/login', () => {
  it('returns 200 + token for valid admin credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'TestPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('admin');
    adminToken = res.body.data.token;
  });

  it('returns tokens for all four roles', async () => {
    const sRes = await request(app).post('/auth/login').send({ email: 'sales@test.com', password: 'TestPass123!' });
    salesToken = sRes.body.data.token;
    const wRes = await request(app).post('/auth/login').send({ email: 'warehouse@test.com', password: 'TestPass123!' });
    warehouseToken = wRes.body.data.token;
    const aRes = await request(app).post('/auth/login').send({ email: 'accounts@test.com', password: 'TestPass123!' });
    accountsToken = aRes.body.data.token;
    expect(salesToken).toBeDefined();
    expect(warehouseToken).toBeDefined();
    expect(accountsToken).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@test.com', password: 'TestPass123!' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'not-an-email', password: 'TestPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'admin@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /auth/me', () => {
  it('returns current user without password_hash', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@test.com');
    expect(res.body.data.password_hash).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for malformed token', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

// ─── 2. CUSTOMERS ───────────────────────────────────────────────────────────
describe('POST /customers', () => {
  it('admin can create a customer with all fields', async () => {
    const res = await request(app)
      .post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ramesh Test', mobile: '9876543210', email: 'ramesh@test.com', business_name: 'Test Traders', gst_number: '27AABCP1234A1Z5', customer_type: 'wholesale', address: '45 Test Road, Pune', status: 'active' });
    expect(res.status).toBe(201);
    customerId = res.body.data.id;
  });

  it('warehouse cannot create a customer — 403', async () => {
    const res = await request(app).post('/customers').set('Authorization', `Bearer ${warehouseToken}`).send({ name: 'WH', mobile: '9000000002', customer_type: 'retail', address: 'Test' });
    expect(res.status).toBe(403);
  });

  it('returns VALIDATION_ERROR for missing required fields', async () => {
    const res = await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'No Mobile' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('returns field error for invalid GST format', async () => {
    const res = await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'GST Test', mobile: '9000000004', customer_type: 'retail', address: 'Test', gst_number: 'INVALIDGST' });
    expect(res.status).toBe(400);
    const gstError = res.body.error.details?.find((d: { field: string }) => d.field === 'gst_number');
    expect(gstError).toBeDefined();
  });

  it('returns 400 for mobile too short (<10 digits)', async () => {
    const res = await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Short Mobile', mobile: '123', customer_type: 'retail', address: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for follow_up_date in the past', async () => {
    const res = await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Past Date', mobile: '9000000006', customer_type: 'retail', address: 'Test', follow_up_date: '2020-01-01' });
    expect(res.status).toBe(400);
    const err = res.body.error.details?.find((d: { field: string }) => d.field === 'follow_up_date');
    expect(err).toBeDefined();
  });

  it('returns 400 for invalid customer_type enum', async () => {
    const res = await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Enum Test', mobile: '9000000007', customer_type: 'invalid', address: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('GET /customers', () => {
  it('all 4 roles can list customers', async () => {
    for (const token of [adminToken, salesToken, warehouseToken, accountsToken]) {
      const res = await request(app).get('/customers').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
    }
  });

  it('search=Ramesh returns matching records', async () => {
    const res = await request(app).get('/customers?search=Ramesh').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: { name: string }) => c.name.includes('Ramesh'))).toBe(true);
  });

  it('status filter returns only matching records', async () => {
    const res = await request(app).get('/customers?status=active').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((c: { status: string }) => c.status === 'active')).toBe(true);
  });

  it('pagination: page=1 limit=1 returns 1 item + correct meta', async () => {
    const res = await request(app).get('/customers?limit=1&page=1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.limit).toBe(1);
    expect(res.body.meta.page).toBe(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/customers');
    expect(res.status).toBe(401);
  });
});

describe('GET /customers/:id', () => {
  it('returns customer detail with notes', async () => {
    const res = await request(app).get(`/customers/${customerId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(customerId);
    expect(res.body.data.customer_notes).toBeDefined();
  });

  it('returns 404 for non-existent ID', async () => {
    const res = await request(app).get('/customers/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /customers/:id/notes', () => {
  it('admin can add a note', async () => {
    const res = await request(app).post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`).send({ note: 'Test audit note' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.name).toBe('Test Admin');
  });

  it('returns 400 for empty note', async () => {
    const res = await request(app).post(`/customers/${customerId}/notes`).set('Authorization', `Bearer ${adminToken}`).send({ note: '' });
    expect(res.status).toBe(400);
  });

  it('warehouse cannot add note — 403', async () => {
    const res = await request(app).post(`/customers/${customerId}/notes`).set('Authorization', `Bearer ${warehouseToken}`).send({ note: 'WH note' });
    expect(res.status).toBe(403);
  });
});

// ─── 3. PRODUCTS ────────────────────────────────────────────────────────────
describe('POST /products', () => {
  it('admin creates product and opening stock movement is logged', async () => {
    const res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Bearing', sku: 'TEST-BRG-001', category: 'Bearings', unit_price: 245.00, current_stock: 100, min_stock_alert: 10 });
    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('TEST-BRG-001');
    productId = res.body.data.id;
  });

  it('SKU is uppercased automatically', async () => {
    const res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Lowercase SKU', sku: 'lowercase-sku-test', category: 'Test', unit_price: 50 });
    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('LOWERCASE-SKU-TEST');
  });

  it('returns 409 for duplicate SKU', async () => {
    const res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dupe', sku: 'TEST-BRG-001', category: 'Bearings', unit_price: 100 });
    expect(res.status).toBe(409);
  });

  it('returns 400 for negative stock', async () => {
    const res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Neg', sku: 'NEG-001', category: 'Test', unit_price: 100, current_stock: -1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for zero unit_price', async () => {
    const res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Zero Price', sku: 'ZERO-001', category: 'Test', unit_price: 0 });
    expect(res.status).toBe(400);
  });

  it('sales cannot create product — 403', async () => {
    const res = await request(app).post('/products').set('Authorization', `Bearer ${salesToken}`)
      .send({ name: 'Sales Prod', sku: 'SALES-001', category: 'Test', unit_price: 100 });
    expect(res.status).toBe(403);
  });
});

describe('Stock movements — non-negative guard', () => {
  it('IN movement increases stock', async () => {
    const res = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 50, movement_type: 'IN', reason: 'Restock' });
    expect(res.status).toBe(201);
    expect(res.body.data.product.current_stock).toBe(150);
  });

  it('OUT movement within stock succeeds', async () => {
    const res = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 10, movement_type: 'OUT', reason: 'Manual dispatch' });
    expect(res.status).toBe(201);
    expect(res.body.data.product.current_stock).toBe(140);
  });

  it('OUT exceeding stock returns 409', async () => {
    const res = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 9999, movement_type: 'OUT', reason: 'Too many' });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('Insufficient stock');
  });

  it('stock reaches exactly 0 — then next OUT fails with 409', async () => {
    const res1 = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 140, movement_type: 'OUT', reason: 'Drain to zero' });
    expect(res1.status).toBe(201);
    expect(res1.body.data.product.current_stock).toBe(0);

    const res2 = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 1, movement_type: 'OUT', reason: 'Should fail' });
    expect(res2.status).toBe(409);
  });

  it('returns 400 for quantity 0', async () => {
    const res = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 0, movement_type: 'IN' });
    expect(res.status).toBe(400);
  });

  it('sales cannot add stock movement — 403', async () => {
    const res = await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${salesToken}`)
      .send({ quantity_changed: 10, movement_type: 'IN' });
    expect(res.status).toBe(403);
  });

  it('low_stock filter returns only products at or below min_stock_alert', async () => {
    // productId has stock=0, min_stock_alert=10 — should appear in low_stock
    const res = await request(app).get('/products?low_stock=true').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((p: { current_stock: number; min_stock_alert: number }) => p.current_stock <= p.min_stock_alert)).toBe(true);
    expect(res.body.data.some((p: { id: string }) => p.id === productId)).toBe(true);
  });
});

// ─── 4. CHALLANS ────────────────────────────────────────────────────────────
describe('Challan lifecycle', () => {
  beforeAll(async () => {
    // Restock productId for challan tests
    await request(app).post(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity_changed: 200, movement_type: 'IN', reason: 'Restock for challan tests' });
  });

  it('sales creates draft challan with server-generated number', async () => {
    const res = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: productId, quantity: 5 }] });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.challan_number).toMatch(/^CH-\d{8}-\d{4}$/);
    expect(res.body.data.challan_items[0].product_name_snapshot).toBeDefined();
    expect(res.body.data.challan_items[0].unit_price_snapshot).toBeDefined();
    challanId = res.body.data.id;
  });

  it('duplicate product IDs are consolidated', async () => {
    const res = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: productId, quantity: 3 }, { product_id: productId, quantity: 7 }] });
    expect(res.status).toBe(201);
    expect(res.body.data.challan_items.length).toBe(1);
    expect(res.body.data.challan_items[0].quantity).toBe(10);
  });

  it('accounts cannot create challan — 403', async () => {
    const res = await request(app).post('/challans').set('Authorization', `Bearer ${accountsToken}`)
      .send({ customer_id: customerId, items: [{ product_id: productId, quantity: 1 }] });
    expect(res.status).toBe(403);
  });

  it('returns 400 for empty items array', async () => {
    const res = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [] });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent customer_id', async () => {
    const res = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: '00000000-0000-0000-0000-000000000000', items: [{ product_id: productId, quantity: 1 }] });
    expect(res.status).toBe(404);
  });

  it('filter by status=draft returns only drafts', async () => {
    const res = await request(app).get('/challans?status=draft').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((c: { status: string }) => c.status === 'draft')).toBe(true);
  });

  it('confirm challan — stock deducted, OUT movement written, status=confirmed', async () => {
    const prodBefore = await request(app).get(`/products/${productId}`).set('Authorization', `Bearer ${adminToken}`);
    const stockBefore = prodBefore.body.data.current_stock;

    const res = await request(app).post(`/challans/${challanId}/confirm`).set('Authorization', `Bearer ${salesToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');

    const prodAfter = await request(app).get(`/products/${productId}`).set('Authorization', `Bearer ${adminToken}`);
    const qty = res.body.data.challan_items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
    expect(prodAfter.body.data.current_stock).toBe(stockBefore - qty);

    const movements = await request(app).get(`/products/${productId}/stock-movements`).set('Authorization', `Bearer ${adminToken}`);
    const challanOuts = movements.body.data.movements.filter((m: { movement_type: string; reason: string }) => m.movement_type === 'OUT' && m.reason?.includes('CH-'));
    expect(challanOuts.length).toBeGreaterThan(0);
  });

  it('cannot re-confirm already-confirmed challan', async () => {
    const res = await request(app).post(`/challans/${challanId}/confirm`).set('Authorization', `Bearer ${salesToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('already confirmed');
  });

  it('cannot cancel a confirmed challan', async () => {
    const res = await request(app).post(`/challans/${challanId}/cancel`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cannot cancel a confirmed');
  });

  it('§5 insufficient stock — 409, entire transaction aborted, stock unchanged', async () => {
    const lowProd = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Low Stock Item', sku: 'LOW-ONLY-2', category: 'Test', unit_price: 100, current_stock: 2 });
    const lowProdId = lowProd.body.data.id;

    const draft = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: lowProdId, quantity: 100 }] });
    expect(draft.status).toBe(201);

    const confirmRes = await request(app).post(`/challans/${draft.body.data.id}/confirm`).set('Authorization', `Bearer ${salesToken}`);
    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.error.message).toContain('Insufficient stock');
    expect(confirmRes.body.error.message).toContain('Low Stock Item');

    const prodCheck = await request(app).get(`/products/${lowProdId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(prodCheck.body.data.current_stock).toBe(2); // UNCHANGED
  });

  it('concurrency: two simultaneous confirms on 1-unit product — exactly one wins', async () => {
    const prod = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Race Test', sku: 'RACE-001', category: 'Test', unit_price: 50, current_stock: 1 });
    const raceId = prod.body.data.id;

    // Create challans SEQUENTIALLY (avoids challan number collision — BUG-01)
    // then confirm CONCURRENTLY to test the stock-level race guard
    const d1 = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: raceId, quantity: 1 }] });
    const d2 = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: raceId, quantity: 1 }] });

    expect(d1.status).toBe(201);
    expect(d2.status).toBe(201);

    // Confirm both AT THE SAME TIME — only one should win
    const [c1, c2] = await Promise.all([
      request(app).post(`/challans/${d1.body.data.id}/confirm`).set('Authorization', `Bearer ${salesToken}`),
      request(app).post(`/challans/${d2.body.data.id}/confirm`).set('Authorization', `Bearer ${salesToken}`),
    ]);
    const statuses = [c1.status, c2.status].sort();
    expect(statuses).toEqual([200, 409]); // exactly one wins, one gets insufficient stock

    // Stock should be exactly 0, never negative
    const final = await request(app).get(`/products/${raceId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(final.body.data.current_stock).toBe(0);
  });

  it('cannot cancel already-cancelled challan', async () => {
    const draft = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: productId, quantity: 1 }] });
    const dId = draft.body.data.id;
    await request(app).post(`/challans/${dId}/cancel`).set('Authorization', `Bearer ${adminToken}`);
    const res = await request(app).post(`/challans/${dId}/cancel`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('already cancelled');
  });

  it('cannot confirm a cancelled challan', async () => {
    const draft = await request(app).post('/challans').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: customerId, items: [{ product_id: productId, quantity: 1 }] });
    const dId = draft.body.data.id;
    await request(app).post(`/challans/${dId}/cancel`).set('Authorization', `Bearer ${adminToken}`);
    const res = await request(app).post(`/challans/${dId}/confirm`).set('Authorization', `Bearer ${salesToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cannot confirm a cancelled');
  });
});

// ─── 5. HEALTH + 404 ────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Unknown routes', () => {
  it('returns 404 JSON with NOT_FOUND code', async () => {
    const res = await request(app).get('/no-such-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
