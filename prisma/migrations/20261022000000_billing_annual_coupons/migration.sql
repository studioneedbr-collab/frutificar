-- Plano anual, cupons de desconto e data de cancelamento (painel financeiro).
-- Idempotente: pode rodar de novo sem erro.

DO $$ BEGIN
  CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CouponDuration" AS ENUM ('ONCE', 'FOREVER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "priceYearly" DECIMAL(10,2);

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "couponId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "couponRevertPending" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER,
    "amountOff" DECIMAL(10,2),
    "duration" "CouponDuration" NOT NULL DEFAULT 'ONCE',
    "plans" "PlanName"[],
    "maxRedemptions" INTEGER,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Plano anual = 10x a mensalidade (2 meses grátis), só onde ainda não foi definido.
UPDATE "Plan" SET "priceYearly" = "priceMonthly" * 10 WHERE "priceYearly" IS NULL;

-- Cancelamentos antigos: usa a última atualização como data de cancelamento.
UPDATE "Subscription" SET "canceledAt" = "updatedAt" WHERE "status" = 'CANCELED' AND "canceledAt" IS NULL;
