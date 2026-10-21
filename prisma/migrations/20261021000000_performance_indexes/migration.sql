-- Índices para as consultas mais comuns (listas por usuário, filtros por status).
-- Idempotente: pode rodar de novo sem erro.
CREATE INDEX IF NOT EXISTS "Payment_userId_paidAt_idx" ON "Payment"("userId", "paidAt");
CREATE INDEX IF NOT EXISTS "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX IF NOT EXISTS "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");
CREATE INDEX IF NOT EXISTS "ChatSession_userId_idx" ON "ChatSession"("userId");
CREATE INDEX IF NOT EXISTS "TechnicalVisit_userId_idx" ON "TechnicalVisit"("userId");
CREATE INDEX IF NOT EXISTS "TechnicalVisit_status_idx" ON "TechnicalVisit"("status");
CREATE INDEX IF NOT EXISTS "ServiceRequest_userId_idx" ON "ServiceRequest"("userId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_status_idx" ON "ServiceRequest"("status");
CREATE INDEX IF NOT EXISTS "Property_userId_idx" ON "Property"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Plot_propertyId_idx" ON "Plot"("propertyId");
CREATE INDEX IF NOT EXISTS "SoilAnalysis_plotId_idx" ON "SoilAnalysis"("plotId");
