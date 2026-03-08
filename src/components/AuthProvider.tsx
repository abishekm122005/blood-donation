'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient, User } from '@supabase/supabase-js'

interface AuthContextType {
  supabase: SupabaseClient | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const client = getSupabaseClient()
      setSupabase(client)

      // Get initial session (reads from cookies via @supabase/ssr)
      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      // Listen for auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => {
        subscription?.unsubscribe()
      }
    } catch {
      console.error('Supabase configuration is missing')
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
      setUser(null)
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ supabase, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
