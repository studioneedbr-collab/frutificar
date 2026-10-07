-- Novo status: teste grátis (sem pagamento).
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'TRIALING' BEFORE 'ACTIVE';
