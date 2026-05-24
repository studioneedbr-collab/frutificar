import { EmptyState } from '@/components/shared/empty-state'
import { User } from 'lucide-react'

export default function PerfilPage() {
  return (
    <EmptyState
      title="Meu Perfil"
      description="Em breve: edite seus dados pessoais, foto e preferências de notificação."
      icon={<User className="h-12 w-12" />}
    />
  )
}
