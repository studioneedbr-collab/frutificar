import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, MessageCircle, Leaf, Radio, Calendar, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Cursos em Vídeo',
    description: 'Aprenda com especialistas em agronomia através de cursos completos sobre culturas e manejo.',
  },
  {
    icon: MessageCircle,
    title: 'Chat IA Agrícola',
    description: 'Tire dúvidas com nossa IA especializada em agricultura e obtenha recomendações personalizadas.',
  },
  {
    icon: Leaf,
    title: 'Diagnóstico de Solo',
    description: 'Analise seus dados de solo e receba recomendações de adubação e correção.',
  },
  {
    icon: Radio,
    title: 'Lives Exclusivas',
    description: 'Participe de transmissões ao vivo com agrônomos e especialistas do campo.',
  },
  {
    icon: Calendar,
    title: 'Visitas Técnicas',
    description: 'Agende visitas de agrônomos à sua propriedade de forma simples e rápida.',
  },
  {
    icon: BarChart3,
    title: 'Gestão Rural',
    description: 'Controle atividades, análises e recomendações da sua propriedade em um só lugar.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: 'color-mix(in oklch, var(--color-frutificar-deep) 95%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          className="text-white font-bold text-xl"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          🌱 Frutificar
        </span>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button
            className="font-semibold"
            style={{
              background: 'white',
              color: 'var(--color-frutificar-green)',
            }}
            asChild
          >
            <Link href="/cadastro">Começar grátis</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center"
        style={{
          background:
            'linear-gradient(135deg, var(--color-frutificar-deep) 0%, var(--color-frutificar-forest) 60%, var(--color-frutificar-green) 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-medium text-white/80"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            Plataforma para o agronegócio
          </span>
          <h1
            className="text-4xl md:text-6xl font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            A plataforma completa para sua propriedade rural
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Educação, gestão e tecnologia para produtores rurais que querem elevar o nível do campo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="font-semibold"
              style={{ background: 'white', color: 'var(--color-frutificar-green)' }}
              asChild
            >
              <Link href="/cadastro">Começar gratuitamente</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/planos">Ver planos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Tudo que o produtor precisa em um lugar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <f.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 px-6 text-center"
        style={{ background: 'var(--color-frutificar-deep)' }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <h2
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Pronto para transformar sua propriedade?
          </h2>
          <p className="text-white/70">Escolha o plano ideal e comece hoje mesmo.</p>
          <Button
            size="lg"
            style={{ background: 'var(--color-frutificar-bright)', color: 'white' }}
            asChild
          >
            <Link href="/planos">Ver planos e preços</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>© 2025 Frutificar Digital · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
