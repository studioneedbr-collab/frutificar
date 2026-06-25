// DEV PREVIEW: renderiza em request-time (depende de banco/sessão); evita prerender sem DB.
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TestAuthPage() {
  const session = await auth()

  if (!session) redirect('/login')

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Auth Test</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}