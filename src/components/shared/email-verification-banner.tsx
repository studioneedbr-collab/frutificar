import { MailWarning } from 'lucide-react'

export function EmailVerificationBanner() {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
      style={{ background: 'oklch(0.92 0.06 75)', color: 'oklch(0.4 0.09 60)' }}
    >
      <MailWarning size={16} className="shrink-0" />
      <span>
        Confirme seu e-mail para garantir o acesso à sua conta. Verifique sua caixa de entrada.
      </span>
    </div>
  )
}
