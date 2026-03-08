'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Loader2, Heart } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const { user, supabase, loading: authLoading } = useAuth()
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      // Wait a bit for auth state to settle after OAuth redirect
      const timeout = setTimeout(() => {
        setStatus('Sign in failed. Redirecting...')
        router.push('/auth/login?error=oauth_failed')
      }, 5000)
      return () => clearTimeout(timeout)
    }

    // User is authenticated — check if profile is complete
    const checkProfile = async () => {
      if (!supabase) return

      setStatus('Checking your profile...')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, blood_group')
        .eq('id', user.id)
        .single()

      if (profile?.blood_group) {
        // Profile complete — go to dashboard
        router.push('/dashboard')
      } else {
        // Profile missing or incomplete — go to complete profile
        router.push('/auth/complete-profile')
      }
    }

    checkProfile()
  }, [user, authLoading, supabase, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Heart className="w-12 h-12 text-red-600 fill-red-600 mb-4" />
      <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
      <p className="text-gray-600 text-lg">{status}</p>
    </div>
  )
}
