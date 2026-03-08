'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, Heart, ArrowRight, ArrowLeft,
  AlertCircle, Loader2, User, Phone, MapPin, Droplets, Check, Shield
} from 'lucide-react'

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strength = getStrength()
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-600']

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 2 ? 'text-red-500' : 'text-green-600'}`}>
        {labels[strength - 1] || 'Too short'}
      </p>
    </div>
  )
}

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, idx) => {
        const stepNum = idx + 1
        const isComplete = currentStep > stepNum
        const isCurrent = currentStep === stepNum

        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isComplete ? <Check className="w-5 h-5" /> : stepNum}
              </div>
              <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-red-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 w-full mx-2 mb-6 transition-colors ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Register() {
  const router = useRouter()
  const { supabase, user } = useAuth()
  const [step, setStep] = useState(1)
  const [signupMethod, setSignupMethod] = useState<'email' | 'google' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    phone: '',
    location: '',
    bloodGroup: '',
    isDonor: true,
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Detect Google OAuth return (URL has step=2 and user is now logged in)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('step') === '2' && user && step === 1) {
      setSignupMethod('google')
      setAuthUserId(user.id)
      const meta = user.user_metadata
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        fullName: meta?.full_name || meta?.name || prev.fullName,
      }))
      setStep(2)
    }
  }, [user, step])

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateEmail = () => {
    const errors: Record<string, string> = {}
    if (!formData.email) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Minimum 6 characters'
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirm your password'
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors: Record<string, string> = {}
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
    if (!formData.age) errors.age = 'Age is required'
    else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 65) errors.age = 'Age must be between 18 and 65'
    if (!formData.phone) errors.phone = 'Phone number is required'
    if (!formData.location.trim()) errors.location = 'Location is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    const errors: Record<string, string> = {}
    if (!formData.bloodGroup) errors.bloodGroup = 'Select your blood group'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Step 1: Email signup — create auth account then advance
  const handleEmailSignup = async () => {
    if (!validateEmail()) return
    if (!supabase) {
      setError('Service unavailable. Please try again later.')
      return
    }

    setLoading(true)
    setSignupMethod('email')
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.status === 429) {
          setError('Too many attempts. Please use a different email or wait a few minutes.')
        } else if (authError.message?.includes('already registered')) {
          setError('This email is already registered. Try logging in instead.')
        } else {
          setError(authError.message || 'Registration failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        setAuthUserId(authData.user.id)
        setStep(2)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Google signup — redirects to Google, comes back with step=2
  const handleGoogleSignup = async () => {
    if (!supabase) return
    setError('')
    setSignupMethod('google')
    setLoading(true)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) {
        setError('Google signup failed. Please try again.')
        setLoading(false)
        setSignupMethod(null)
      }
    } catch {
      setError('Google signup is not available right now.')
      setLoading(false)
      setSignupMethod(null)
    }
  }

  // Step 3: Submit — create profile in database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validateStep3()) return

    const userId = authUserId || user?.id
    if (!userId) {
      setError('Authentication error. Please start over.')
      return
    }

    setLoading(true)

    try {
      if (!supabase) {
        setError('Service unavailable. Please try again later.')
        setLoading(false)
        return
      }

      const profilePayload = {
        id: userId,
        email: formData.email.trim().toLowerCase() || user?.email || '',
        full_name: formData.fullName.trim(),
        age: parseInt(formData.age),
        blood_group: formData.bloodGroup,
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        is_donor: formData.isDonor,
      }

      // Try upsert — RLS allows users to insert/update their own profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })

      if (upsertError) {
        setError(upsertError.message || 'Profile creation failed. Please contact support.')
        setLoading(false)
        return
      }

      setSuccessMessage('Account created successfully! Please login to continue...')

      // Always redirect to login after registration
      if (signupMethod === 'google' || user) {
        // Sign out so user must login fresh
        await supabase.auth.signOut()
      }
      setTimeout(() => router.push('/auth/login?registered=true'), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <span className="text-3xl font-bold">BloodConnect</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Join the<br />Movement
          </h1>
          <p className="text-xl text-red-100 leading-relaxed max-w-md">
            Register today and become part of a community dedicated to saving lives through blood donation.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-red-100">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span>Secure & verified profiles</span>
            </div>
            <div className="flex items-center gap-3 text-red-100">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <span>Instant donor matching</span>
            </div>
            <div className="flex items-center gap-3 text-red-100">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span>Find donors near you</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <Heart className="w-8 h-8 text-red-600 fill-red-600" />
            <span className="text-2xl font-bold text-gray-900">BloodConnect</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
            <p className="text-gray-500 mt-2">
              {step === 1 && 'Choose how you want to sign up'}
              {step === 2 && 'Tell us about yourself'}
              {step === 3 && 'Almost done! Select your blood details'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          <StepIndicator currentStep={step} steps={['Sign Up', 'Personal Info', 'Blood Details']} />

          <form onSubmit={handleSubmit}>
            {/* ===== Step 1: Sign Up Method ===== */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Google Signup */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                >
                  {loading && signupMethod === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Sign up with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-50 text-gray-400">or sign up with email</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        fieldErrors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {fieldErrors.email && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        fieldErrors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                      }`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.password}</p>}
                  <PasswordStrength password={formData.password} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                      }`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleEmailSignup}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
                >
                  {loading && signupMethod === 'email' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Continue with Email
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ===== Step 2: Personal Details ===== */}
            {step === 2 && (
              <div className="space-y-5">
                {signupMethod === 'google' && formData.fullName && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                    Welcome, {formData.fullName}! Please complete your details below.
                  </div>
                )}

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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateField('age', e.target.value)}
                      min="18"
                      max="65"
                      className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        fieldErrors.age ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                      }`}
                      placeholder="25"
                    />
                  </div>
                  {fieldErrors.age && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.age}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        fieldErrors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-red-500'
                      }`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {fieldErrors.phone && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.phone}</p>}
                </div>

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

                <button
                  type="button"
                  onClick={() => { setError(''); if (validateStep2()) setStep(3) }}
                  className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ===== Step 3: Blood Details ===== */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Blood Group</label>
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
                      <Droplets className={`w-8 h-8 mx-auto mb-2 ${formData.isDonor ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold ${formData.isDonor ? 'text-red-700' : 'text-gray-600'}`}>
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
                      <Heart className={`w-8 h-8 mx-auto mb-2 ${!formData.isDonor ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold ${!formData.isDonor ? 'text-red-700' : 'text-gray-600'}`}>
                        Receive Blood
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setFieldErrors({}); setError('') }}
                    className="flex-1 border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-8 text-center text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-red-600 hover:text-red-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
