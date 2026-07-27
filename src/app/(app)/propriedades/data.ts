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
