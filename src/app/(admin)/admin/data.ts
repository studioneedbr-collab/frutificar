// Tipos das "Solicitações recentes" do dashboard admin.
// Compartilhados entre o server page e a view client (mesmo padrão de Propriedades).

export type Solicitation = {
  id: string
  kind: 'visit' | 'service'
  type: string
  user: string
  detail: string
  when: string
}
