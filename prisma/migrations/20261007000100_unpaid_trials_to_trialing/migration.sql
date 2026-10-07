-- Assinaturas criadas pelo cadastro (trial de 7 dias) ficavam como ACTIVE sem
-- nenhum pagamento. Passam a TRIALING. Só mexe em alunos sem pagamento PAID e
-- cuja vigência é a do trial (≤ 8 dias após a criação) — assinaturas
-- concedidas pelo admin (1 ano) e as pagas continuam ACTIVE.
UPDATE "Subscription" s
SET "status" = 'TRIALING'
FROM "User" u
WHERE u."id" = s."userId"
  AND u."role" = 'STUDENT'
  AND s."status" = 'ACTIVE'
  AND s."currentPeriodEnd" <= s."createdAt" + INTERVAL '8 days'
  AND NOT EXISTS (
    SELECT 1 FROM "Payment" p
    WHERE p."status" = 'PAID'
      AND (p."subscriptionId" = s."id" OR p."userId" = s."userId")
  );
