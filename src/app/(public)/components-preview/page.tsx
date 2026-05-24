import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

export default function ComponentsPreviewPage() {
  return (
    <main className="container mx-auto p-8 space-y-8">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        Frutificar — Design System Preview
      </h1>

      {/* Brand colors */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta Frutificar</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <div
            className="h-12 w-24 rounded flex items-end p-1"
            style={{ background: 'var(--color-frutificar-deep, #0e3d1f)' }}
          >
            <span className="text-xs text-white/70">Deep</span>
          </div>
          <div
            className="h-12 w-24 rounded flex items-end p-1"
            style={{ background: 'var(--color-frutificar-forest, #1a5c2e)' }}
          >
            <span className="text-xs text-white/70">Forest</span>
          </div>
          <div
            className="h-12 w-24 rounded flex items-end p-1"
            style={{ background: 'var(--color-frutificar-green, #2d7a3e)' }}
          >
            <span className="text-xs text-white/70">Green</span>
          </div>
          <div
            className="h-12 w-24 rounded flex items-end p-1"
            style={{ background: 'var(--color-frutificar-bright, #4caf50)' }}
          >
            <span className="text-xs text-white/70">Bright</span>
          </div>
          <div
            className="h-12 w-24 rounded flex items-end p-1"
            style={{ background: 'var(--color-frutificar-light, #a5d6a7)' }}
          >
            <span className="text-xs text-black/50">Light</span>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      {/* Form elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg">Mensagem</Label>
            <Textarea id="msg" placeholder="Digite sua mensagem..." />
          </div>
        </CardContent>
      </Card>

      {/* Badges & Avatars */}
      <Card>
        <CardHeader>
          <CardTitle>Badges &amp; Avatars</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-center flex-wrap">
          <Badge>ESSENCIAL</Badge>
          <Badge variant="secondary">PREMIUM</Badge>
          <Badge variant="outline">GOLD</Badge>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cursos">
            <TabsList>
              <TabsTrigger value="cursos">Cursos</TabsTrigger>
              <TabsTrigger value="progresso">Progresso</TabsTrigger>
              <TabsTrigger value="cert">Certificados</TabsTrigger>
            </TabsList>
            <TabsContent value="cursos">
              <p className="text-sm text-muted-foreground mt-2">Lista de cursos aqui.</p>
            </TabsContent>
            <TabsContent value="progresso">
              <p className="text-sm text-muted-foreground mt-2">Progresso aqui.</p>
            </TabsContent>
            <TabsContent value="cert">
              <p className="text-sm text-muted-foreground mt-2">Certificados aqui.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton &amp; Spinner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Separator />
          <LoadingSpinner />
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Empty State</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nenhum curso encontrado"
            description="Explore nosso catálogo e inicie sua jornada no campo."
            action={<Button>Explorar Cursos</Button>}
          />
        </CardContent>
      </Card>
    </main>
  )
}
