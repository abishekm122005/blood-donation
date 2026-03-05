'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (url && key) {
      const client = createClient(url, key)
      setSupabase(client)

      const { data: { subscription } } = client.auth.onAuthStateChange(() => {
        client.auth.getUser().then(({ data: { user } }) => {
          setUser(user)
        })
      })

      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
      setUser(null)
    }
  }

  return (
    <nav className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">🩸</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">BloodConnect</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/search" className="hover:bg-red-700 px-3 py-2 rounded">
              Find Donors
            </Link>
            <Link href="/request-blood" className="hover:bg-red-700 px-3 py-2 rounded">
              Request Blood
            </Link>
            <Link href="/camps" className="hover:bg-red-700 px-3 py-2 rounded">
              Donation Camps
            </Link>
            <Link href="/blood-banks" className="hover:bg-red-700 px-3 py-2 rounded">
              Blood Banks
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="hover:bg-red-700 px-3 py-2 rounded">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:bg-red-700 px-3 py-2 rounded">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded font-semibold"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/search" className="block hover:bg-red-700 px-3 py-2 rounded">
              Find Donors
            </Link>
            <Link href="/request-blood" className="block hover:bg-red-700 px-3 py-2 rounded">
              Request Blood
            </Link>
            <Link href="/camps" className="block hover:bg-red-700 px-3 py-2 rounded">
              Donation Camps
            </Link>
            <Link href="/blood-banks" className="block hover:bg-red-700 px-3 py-2 rounded">
              Blood Banks
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block hover:bg-red-700 px-3 py-2 rounded">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left bg-red-700 hover:bg-red-800 px-3 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block hover:bg-red-700 px-3 py-2 rounded">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block bg-white text-red-600 hover:bg-gray-100 px-3 py-2 rounded font-semibold"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
