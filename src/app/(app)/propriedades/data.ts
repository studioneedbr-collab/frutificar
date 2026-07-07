// Tipos + dados mock da tela de Propriedades (compartilhados entre o server page e a view client).

export type Status = 'Saudável' | 'Atenção' | 'Pousio'

export type Talhao = {
  id: string
  name: string
  cultura: string
  area: string
  status: Status
}

export type Property = {
  id: string
  name: string
  location: string
  area: string
  talhoes: number
  cultura: string
  altitude?: string
  talhoesList: Talhao[]
}

export const mockProperties: Property[] = [
  {
    id: 'p1',
    name: 'Fazenda Santa Clara',
    location: 'Patrocínio/MG',
    area: '84 ha',
    talhoes: 4,
    cultura: 'Café arábica',
    altitude: '980 m',
    talhoesList: [
      { id: 'p1-t1', name: 'Talhão A1', cultura: 'Café Catuaí', area: '24 ha', status: 'Saudável' },
      { id: 'p1-t2', name: 'Talhão A2', cultura: 'Café Mundo Novo', area: '18 ha', status: 'Atenção' },
      { id: 'p1-t3', name: 'Talhão B1', cultura: 'Café Bourbon', area: '22 ha', status: 'Saudável' },
      { id: 'p1-t4', name: 'Várzea', cultura: 'Pousio', area: '20 ha', status: 'Pousio' },
    ],
  },
  {
    id: 'p2',
    name: 'Sítio Boa Vista',
    location: 'Araxá/MG',
    area: '28 ha',
    talhoes: 2,
    cultura: 'Café + Milho',
    talhoesList: [
      { id: 'p2-t1', name: 'Talhão 1', cultura: 'Café Catuaí', area: '16 ha', status: 'Saudável' },
      { id: 'p2-t2', name: 'Talhão 2', cultura: 'Milho', area: '12 ha', status: 'Atenção' },
    ],
  },
]
