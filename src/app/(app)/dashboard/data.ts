// Tipos + dados mock da tela de Dashboard (compartilhados entre o server page e a view client).
// Apenas os campos abaixo são lidos do banco; o restante da view permanece mock.

export type DashboardData = {
  propertyName: string
  propertyLocation: string
  plotsCount: number
  nextLiveTitle: string
  nextLiveWhen: string
}

export const mockDashboard: DashboardData = {
  propertyName: 'Fazenda Santa Clara',
  propertyLocation: 'Patrocínio/MG',
  plotsCount: 4,
  nextLiveTitle: 'Manejo de pragas na entressafra',
  nextLiveWhen: 'Qua, 26 jun · 19h',
}
