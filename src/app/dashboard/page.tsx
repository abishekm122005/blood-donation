'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProfile } from '@/lib/database'
import { Profile } from '@/types/database'
import { Heart, MapPin, Activity } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        router.push('/auth/login')
        return
      }

      const supabase = createClient(url, key)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      try {
        const profileData = await getProfile(user.id)
        setProfile(profileData)
      } catch (err) {
        console.error('Error loading profile:', err)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard</h1>

        {/* Profile Card */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{profile.full_name}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            <span className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-lg font-bold text-2xl">
              {profile.blood_group}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="text-lg font-semibold text-gray-900">{profile.age} years</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-lg font-semibold text-gray-900">{profile.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-lg font-semibold text-gray-900">{profile.location}</dd>
                </div>
              </dl>
            </div>

            <div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Donation Status</dt>
                  <dd className={`text-lg font-semibold ${profile.is_available ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.is_available ? 'Available' : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {profile.is_donor ? 'Donor' : 'Recipient'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Edit Profile
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Donations</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <Heart className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Last Donation</p>
                <p className="text-2xl font-bold text-gray-900">Never</p>
              </div>
              <Activity className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Eligible to Donate</p>
                <p className="text-2xl font-bold text-green-600">Yes</p>
              </div>
              <MapPin className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button className="bg-red-600 text-white p-6 rounded-lg font-semibold hover:bg-red-700 text-lg">
            View Donation History
          </button>
          <button className="bg-blue-600 text-white p-6 rounded-lg font-semibold hover:bg-blue-700 text-lg">
            Find Nearby Donation Camps
          </button>
        </div>
      </div>
    </div>
  )
}