// Tokens de uso único (reset de senha, verificação de e-mail, convite).
// O link enviado por e-mail leva o token "cru"; no banco fica só o SHA-256 —
// quem ler o banco não consegue usar os links.
import 'server-only'
import { createHash, randomBytes } from 'crypto'

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function newToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex')
  return { raw, hash: hashToken(raw) }
}

/**
 * Valores a procurar no banco para um token recebido no link. Inclui o token
 * cru para aceitar links emitidos antes do hash (expiram em até 72h).
 */
export function tokenLookup(raw: string): string[] {
  return [hashToken(raw), raw]
}
