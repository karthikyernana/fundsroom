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

  if (low_stock) {
    // Column-to-column comparison (current_stock <= min_stock_alert) is not
    // supported natively by Prisma filters, so use a parameterized raw query
    // to keep filtering and pagination in the database.
    const conditions: Prisma.Sql[] = [Prisma.sql`"current_stock" <= "min_stock_alert"`];
    if (category) conditions.push(Prisma.sql`LOWER("category") = LOWER(${category})`);
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        Prisma.sql`("name" ILIKE ${pattern} OR "sku" ILIKE ${pattern} OR "category" ILIKE ${pattern} OR "location" ILIKE ${pattern})`
      );
    }
    const whereSql = Prisma.join(conditions, ' AND ');
    const orderBy = Prisma.sql`ORDER BY "category" ASC, "name" ASC`;

type ProductRow = NonNullable<Awaited<ReturnType<typeof prisma.products.findFirst>>>;

    const [products, countResult] = await Promise.all([
      prisma.$queryRaw<ProductRow[]>`
        SELECT * FROM "products" WHERE ${whereSql} ${orderBy} LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "products" WHERE ${whereSql}
      `,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const where: Prisma.productsWhereInput = {};
  if (category) where.category = { equals: category, mode: 'insensitive' };
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
      take: limit,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.products.count({ where }),
  ]);

  return {
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

export async function createProduct(data: CreateProductInput, userId: string) {
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
  const existing = await prisma.products.findUnique({ where: { id: productId } });
  if (!existing) throw new AppError(404, 'Product not found');

  // The stock update and audit record are one unit of work. Without this
  // transaction, an audit-log failure would leave inventory changed but
  // untraceable.
  return prisma.$transaction(async (tx) => {
    // Re-check existence inside the transaction to avoid TOCTOU with deletes.
    if (!(await tx.products.findUnique({ where: { id: productId } }))) {
      throw new AppError(404, 'Product not found');
    }
    if (data.movement_type === 'OUT') {
      const affected = await tx.$executeRaw`
        UPDATE "products"
        SET    "current_stock" = "current_stock" - ${data.quantity_changed},
               "updated_at"   = NOW()
        WHERE  "id"           = ${productId}
        AND    "current_stock" >= ${data.quantity_changed}
      `;

      if (affected === 0) {
        const fresh = await tx.products.findUnique({
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
      await tx.products.update({
        where: { id: productId },
        data: { current_stock: { increment: data.quantity_changed } },
      });
    }

    return tx.stock_movements.create({
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
  });
}

// ─── Get stock movements ──────────────────────────────────────────────────────

export async function getStockMovements(
  productId: string,
  query: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = query;
  const product = await prisma.products.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const where = { product_id: productId };
  const [movements, total] = await Promise.all([
    prisma.stock_movements.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.stock_movements.count({ where }),
  ]);

  return {
    product,
    movements,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
