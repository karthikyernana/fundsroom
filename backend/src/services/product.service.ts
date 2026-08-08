import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import type {
  CreateProductInput,
  UpdateProductInput,
  StockMovementInput,
  ProductQuery,
} from '../validators/product.schema';

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listProducts(query: ProductQuery) {
  const { search, category, page = 1, limit = 20, low_stock } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.productsWhereInput = {};
  if (category) where.category = { equals: category, mode: 'insensitive' };
  if (low_stock) {
    // Products whose current_stock is at or below min_stock_alert
    where.current_stock = { lte: prisma.products.fields.min_stock_alert as unknown as number };
    // Prisma doesn't support column-to-column comparisons natively —
    // we use a raw approach: filter in application layer after fetching (handled below)
    // Remove the broken where and instead post-filter
    delete where.current_stock;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take: low_stock ? undefined : limit, // fetch all for post-filter if low_stock
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.products.count({ where }),
  ]);

  // Post-filter for low_stock (column-to-column comparison)
  const filtered = low_stock
    ? products.filter((p) => p.current_stock <= p.min_stock_alert)
    : products;

  const paginated = low_stock ? filtered.slice(skip, skip + limit) : filtered;

  return {
    data: paginated,
    meta: {
      total: low_stock ? filtered.length : total,
      page,
      limit,
      totalPages: Math.ceil((low_stock ? filtered.length : total) / limit),
    },
  };
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getProduct(id: string) {
  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      _count: { select: { stock_movements: true, challan_items: true } },
    },
  });

  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProduct(data: CreateProductInput, userId?: string) {
  if (userId) {
    return createProductWithUser(data, userId);
  }

  // Fallback: find first admin/user to record initial movement if needed
  const defaultUser = await prisma.users.findFirst({ select: { id: true } });
  if (!defaultUser) throw new AppError(500, 'System user missing');

  return createProductWithUser(data, defaultUser.id);
}

// ─── Create with userId (used by route handler) ───────────────────────────────

export async function createProductWithUser(data: CreateProductInput, userId: string) {
  const existing = await prisma.products.findUnique({ where: { sku: data.sku } });
  if (existing) throw new AppError(409, `SKU "${data.sku}" already exists`);

  return prisma.$transaction(async (tx) => {
    const product = await tx.products.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unit_price: data.unit_price,
        current_stock: data.current_stock ?? 0,
        min_stock_alert: data.min_stock_alert ?? 10,
        location: data.location || undefined,
      },
    });

    // Record opening stock movement if non-zero
    if (product.current_stock > 0) {
      await tx.stock_movements.create({
        data: {
          product_id: product.id,
          quantity_changed: product.current_stock,
          movement_type: 'IN',
          reason: 'Initial stock on product creation',
          created_by: userId,
        },
      });
    }

    return product;
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProduct(id: string, data: UpdateProductInput) {
  const existing = await prisma.products.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Product not found');

  // SKU uniqueness check (if SKU is being changed)
  if (data.sku && data.sku !== existing.sku) {
    const skuConflict = await prisma.products.findUnique({ where: { sku: data.sku } });
    if (skuConflict) throw new AppError(409, `SKU "${data.sku}" already exists`);
  }

  const updateData: Prisma.productsUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.unit_price !== undefined) updateData.unit_price = data.unit_price;
  if (data.min_stock_alert !== undefined) updateData.min_stock_alert = data.min_stock_alert;
  if (data.location !== undefined) updateData.location = data.location || null;
  // Note: current_stock is NOT directly editable via product update —
  // all stock changes must go through the stock-movements endpoint to maintain audit trail.

  return prisma.products.update({ where: { id }, data: updateData });
}

// ─── Add stock movement ───────────────────────────────────────────────────────

export async function addStockMovement(
  productId: string,
  data: StockMovementInput,
  userId: string
) {
  const product = await prisma.products.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  if (data.movement_type === 'OUT') {
    // Non-negative stock guard — same atomic pattern used in challan confirm
    const affected = await prisma.$executeRaw`
      UPDATE "products"
      SET    "current_stock" = "current_stock" - ${data.quantity_changed},
             "updated_at"   = NOW()
      WHERE  "id"           = ${productId}
      AND    "current_stock" >= ${data.quantity_changed}
    `;

    if (affected === 0) {
      // Re-fetch for accurate error message
      const fresh = await prisma.products.findUnique({
        where: { id: productId },
        select: { current_stock: true },
      });
      throw new AppError(
        409,
        `Insufficient stock: available ${fresh?.current_stock ?? 0}, ` +
        `requested ${data.quantity_changed}`
      );
    }
  } else {
    // IN movement — safe to do normally
    await prisma.products.update({
      where: { id: productId },
      data: { current_stock: { increment: data.quantity_changed } },
    });
  }

  // Write movement record
  const movement = await prisma.stock_movements.create({
    data: {
      product_id: productId,
      quantity_changed: data.quantity_changed,
      movement_type: data.movement_type,
      reason: data.reason || undefined,
      created_by: userId,
    },
    include: {
      user: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, sku: true, current_stock: true } },
    },
  });

  return movement;
}

// ─── Get stock movements ──────────────────────────────────────────────────────

export async function getStockMovements(productId: string) {
  const product = await prisma.products.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const movements = await prisma.stock_movements.findMany({
    where: { product_id: productId },
    orderBy: { created_at: 'desc' },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return { product, movements };
}
