// Tipo de linha da tabela de usuários (admin) + mock usado no modo preview (sem banco).
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

export const mockUsers: User[] = [
  { id: '1',  name: 'João Carlos Silva',     email: 'joao@exemplo.com',     plan: 'GOLD',      status: 'ACTIVE',   role: 'STUDENT',    joined: '12 jun 2026' },
  { id: '2',  name: 'Maria Aparecida Costa', email: 'maria@exemplo.com',    plan: 'PREMIUM',   status: 'ACTIVE',   role: 'STUDENT',    joined: '11 jun 2026' },
  { id: '3',  name: 'Pedro Henrique Souza',  email: 'pedro@exemplo.com',    plan: 'ESSENCIAL', status: 'ACTIVE',   role: 'STUDENT',    joined: '10 jun 2026' },
  { id: '4',  name: 'Ana Beatriz Lima',      email: 'ana@exemplo.com',      plan: 'GOLD',      status: 'PAST_DUE', role: 'STUDENT',    joined: '09 jun 2026' },
  { id: '5',  name: 'Carlos Eduardo Rocha',  email: 'carlos@exemplo.com',   plan: 'PREMIUM',   status: 'ACTIVE',   role: 'STUDENT',    joined: '08 jun 2026' },
  { id: '6',  name: 'Fernanda Oliveira',     email: 'fernanda@exemplo.com', plan: 'ESSENCIAL', status: 'CANCELED', role: 'STUDENT',    joined: '07 jun 2026' },
  { id: '7',  name: 'Roberto Santos Neto',   email: 'roberto@exemplo.com',  plan: 'GOLD',      status: 'ACTIVE',   role: 'STUDENT',    joined: '06 jun 2026' },
  { id: '8',  name: 'Luciana Ferreira',      email: 'luciana@exemplo.com',  plan: 'PREMIUM',   status: 'ACTIVE',   role: 'INSTRUCTOR', joined: '05 jun 2026' },
  { id: '9',  name: 'Douglas Vargas Garcia', email: 'admin@frutificar.com', plan: 'GOLD',      status: 'ACTIVE',   role: 'ADMIN',      joined: '01 jan 2026' },
  { id: '10', name: 'Marcos Antônio Prado',  email: 'marcos@exemplo.com',   plan: 'ESSENCIAL', status: 'ACTIVE',   role: 'STUDENT',    joined: '04 jun 2026' },
]
