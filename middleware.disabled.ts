// middleware.ts  (à la racine du projet Next.js)
// Protège les routes /dashboard et gère la session Supabase

import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Rafraîchit la session si nécessaire (cookie rolling)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Routes protégées → redirect vers /login si pas connecté
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Routes auth → redirect vers /dashboard si déjà connecté
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      const dashUrl = req.nextUrl.clone()
      dashUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
