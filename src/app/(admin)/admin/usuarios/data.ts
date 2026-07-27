// Tipo de linha da tabela de usuários (admin).
// A página server mapeia os dados reais (listUsers) para este mesmo formato.

export type User = {
  id: string
  name: string
  email: string
  plan: string
  status: string
  role: string
  joined: string
}
