'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import {
  Heart, Droplets, Phone, MapPin, User,
  AlertCircle, Loader2, Check, ArrowRight
} from 'lucide-react'
import { createUserProfile } from '@/app/actions/auth'

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export default function CompleteProfile() {
  const router = useRouter()
  const { supabase, user, loading: authLoading } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    phone: '',
    location: '',
    bloodGroup: '',
    isDonor: true,
  })

  // Pre-fill name from Google metadata
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata
      setFormData(prev => ({
        ...prev,
        fullName: meta?.full_name || meta?.name || prev.fullName,
      }))
    }
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
    if (!formData.age) errors.age = 'Age is required'
    else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 65) errors.age = 'Age must be 18–65'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    if (!formData.location.trim()) errors.location = 'Location is required'
    if (!formData.bloodGroup) errors.bloodGroup = 'Select your blood group'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    if (!user) return

    setLoading(true)

    try {
      if (!supabase) {
        setError('Service unavailable. Please try again later.')
        setLoading(false)
        return
      }

      const result = await createUserProfile({
        id: user.id,
        email: user.email || '',
        full_name: formData.fullName.trim(),
        age: parseInt(formData.age),
        blood_group: formData.bloodGroup,
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        is_donor: formData.isDonor,
      })

      if (!result.success) {
        setError(result.error || 'Failed to save profile. Please try again.')
        setLoading(false)
        return
      }

      // Sign out so user must login fresh after completing profile
      await supabase.auth.signOut()
      router.push('/auth/login?registered=true')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Heart className="w-8 h-8 text-red-600 fill-red-600" />
          <span className="text-2xl font-bold text-gray-900">BloodConnect</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
            <p className="text-gray-500 mt-2">
              Just a few more details to get you started
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    fieldErrors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {fieldErrors.fullName && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.fullName}</p>}
            </div>

            {/* Age + Phone side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  min="18"
                  max="65"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    fieldErrors.age ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="25"
                />
                {fieldErrors.age && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.age}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      fieldErrors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                    }`}
                    placeholder="+91 98765..."
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.phone}</p>}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    fieldErrors.location ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="Mumbai, Maharashtra"
                />
              </div>
              {fieldErrors.location && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.location}</p>}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(group => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => updateField('bloodGroup', group)}
                    className={`py-3 rounded-xl font-bold text-lg transition-all duration-200 border-2 ${
                      formData.bloodGroup === group
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-md shadow-red-600/15'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
              {fieldErrors.bloodGroup && <p className="mt-2 text-sm text-red-500">{fieldErrors.bloodGroup}</p>}
            </div>

            {/* Donor / Recipient */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('isDonor', true)}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                    formData.isDonor
                      ? 'border-red-600 bg-red-50 shadow-md shadow-red-600/15'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Droplets className={`w-7 h-7 mx-auto mb-2 ${formData.isDonor ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold text-sm ${formData.isDonor ? 'text-red-700' : 'text-gray-600'}`}>
                    Donate Blood
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('isDonor', false)}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                    !formData.isDonor
                      ? 'border-red-600 bg-red-50 shadow-md shadow-red-600/15'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Heart className={`w-7 h-7 mx-auto mb-2 ${!formData.isDonor ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold text-sm ${!formData.isDonor ? 'text-red-700' : 'text-gray-600'}`}>
                    Receive Blood
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
