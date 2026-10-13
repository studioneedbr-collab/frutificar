-- Integração Asaas: status "aguardando pagamento" + dados da cobrança no Payment.
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'TRIALING';

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gatewayPaymentId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "billingType" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");
