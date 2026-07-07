// Tipos + dados mock da tela de Planos (admin) — compartilhados entre o server page e a view client.

export type Plan = {
  id: string
  name: string
  price: number
  color: string
  active: boolean
  subscribers: number
  revenue: string
  features: string[]
}

export const mockPlans: Plan[] = [
  {
    id: '1',
    name: 'Essencial', price: 47, color: 'oklch(0.55 0.1 220)', active: true,
    subscribers: 412, revenue: 'R$ 19.364',
    features: ['Cursos principais', 'Lives semanais', 'Podcasts', 'Diagnóstico básico', '1 propriedade'],
  },
  {
    id: '2',
    name: 'Premium', price: 97, color: 'oklch(0.62 0.12 55)', active: true,
    subscribers: 389, revenue: 'R$ 37.733',
    features: ['Tudo do Essencial', 'Chat com IA', 'Minicursos', 'Gestão da propriedade', 'Agendamento de visitas', 'Serviços técnicos', 'Até 3 propriedades'],
  },
  {
    id: '3',
    name: 'Gold', price: 197, color: 'oklch(0.78 0.17 75)', active: true,
    subscribers: 146, revenue: 'R$ 28.762',
    features: ['Tudo do Premium', 'Dias de campo', 'Tutoria personalizada', 'Propriedades ilimitadas', 'Acesso antecipado a conteúdos', 'Suporte prioritário'],
  },
]
