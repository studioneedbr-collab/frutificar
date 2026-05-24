import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/cadastro', '/esqueci-senha', '/']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/) !== null

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/gestao')

  if (
    isAdminPath &&
    req.auth?.user?.role !== 'ADMIN' &&
    req.auth?.user?.role !== 'INSTRUCTOR'
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
