import assert from 'node:assert'
import { interpretAsaasEvent } from '../src/lib/asaas-webhook.ts'

assert.equal(interpretAsaasEvent('PAYMENT_CONFIRMED').kind, 'activate')
assert.equal(interpretAsaasEvent('PAYMENT_OVERDUE').kind, 'status')
assert.deepEqual(interpretAsaasEvent('PAYMENT_OVERDUE'), { kind: 'status', status: 'PAST_DUE' })
assert.equal(interpretAsaasEvent('QUALQUER_OUTRO').kind, 'ignore')
console.log('✅ interpretAsaasEvent ok')
