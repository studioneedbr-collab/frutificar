-- Fim do teste grátis: só entra quem paga. Contas em teste (sem pagamento)
-- passam a "aguardando pagamento" e caem no checkout no próximo acesso.
UPDATE "Subscription" SET "status" = 'PENDING' WHERE "status" = 'TRIALING';
