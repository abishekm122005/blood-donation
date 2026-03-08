import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // setAll called from a Server Component — safe to ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has a complete profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, blood_group')
          .eq('id', user.id)
          .single()

        if (profile?.blood_group) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        return NextResponse.redirect(`${origin}/auth/complete-profile`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // No code or exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
}
