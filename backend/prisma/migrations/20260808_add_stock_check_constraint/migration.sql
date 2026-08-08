-- Migration: add_stock_check_constraint
-- Purpose: Database-level backstop ensuring current_stock can never be negative.
--
-- This is the SECONDARY guard. The PRIMARY guard is the atomic
-- UPDATE ... WHERE current_stock >= qty in the confirmChallan service,
-- which prevents the TOCTOU race at the application level.
--
-- This constraint catches any code path that bypasses the service layer
-- (raw SQL, direct DB access, future bugs) — the database itself refuses
-- any write that would produce a negative stock value.
--
-- Note: Prisma does not yet natively support CHECK constraints in schema.prisma,
-- so this is applied as a manual migration file.

ALTER TABLE "products"
  ADD CONSTRAINT "products_stock_non_negative"
  CHECK ("current_stock" >= 0);
