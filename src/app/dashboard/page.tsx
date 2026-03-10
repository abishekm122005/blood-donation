'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useDatabase } from '@/hooks/useDatabase'
import { Profile, DonationCamp } from '@/types/database'
import { getDonationCamps, registerForCamp, calculateDistance, getBloodRequests } from '@/lib/database'
import type { BloodRequest } from '@/types/database'
import Link from 'next/link'
import {
  Heart, MapPin, Activity, User, Phone, Mail, Calendar,
  Droplets, Shield, Clock, Edit3, X, Check, Loader2,
  ChevronRight, Search, LogOut, Navigation, AlertCircle,
  LocateFixed, Tent, Building2, FileText, Siren
} from 'lucide-react'

function ProfileAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-20 h-20 text-2xl bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-red-600/25">
      {initials}
    </div>
  )
}

/* ============================
   DONOR DASHBOARD
   ============================ */
interface CampWithDistance extends DonationCamp {
  distance?: number
}

function DonorDashboard({ profile, user }: { profile: Profile; user: { id: string } }) {
  const [allCamps, setAllCamps] = useState<CampWithDistance[]>([])
  const [camps, setCamps] = useState<CampWithDistance[]>([])
  const [loadingCamps, setLoadingCamps] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userCity, setUserCity] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const [registered, setRegistered] = useState<Set<string>>(new Set())
  const [campError, setCampError] = useState('')
  const [campRadius, setCampRadius] = useState(25)

  const computeCampsWithDistance = useCallback(
    (campList: CampWithDistance[], loc: { lat: number; lng: number } | null) => {
      if (!loc) return campList
      return campList
        .map(camp => ({
          ...camp,
          distance:
            camp.latitude && camp.longitude
              ? calculateDistance(loc.lat, loc.lng, camp.latitude, camp.longitude)
              : undefined,
        }))
        .sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0
          if (a.distance === undefined) return 1
          if (b.distance === undefined) return -1
          return a.distance - b.distance
        })
    },
    []
  )

  // Filter camps within selected radius
  const filterByRadius = useCallback(
    (campList: CampWithDistance[], radius: number) => {
      return campList.filter(camp => {
        if (camp.distance === undefined) return false
        return camp.distance <= radius
      })
    },
    []
  )

  // Load all camps once
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDonationCamps('upcoming')
        setAllCamps(data as CampWithDistance[])
      } catch {
        setCampError('Failed to load camps')
      } finally {
        setLoadingCamps(false)
      }
    }
    load()
  }, [])

  // Recompute filtered camps when location, radius, or allCamps change
  useEffect(() => {
    const withDistance = computeCampsWithDistance(allCamps, userLocation)
    if (userLocation) {
      setCamps(filterByRadius(withDistance, campRadius))
    } else {
      setCamps(withDistance)
    }
  }, [allCamps, userLocation, campRadius, computeCampsWithDistance, filterByRadius])

  // Reverse geocode to get city name
  const detectCity = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.address) {
        const addr = data.address
        setUserCity(addr.city || addr.town || addr.village || addr.county || '')
      }
    } catch {
      // fallback: extract from profile location
      if (profile.location) {
        const parts = profile.location.split(',').map((p: string) => p.trim()).filter(Boolean)
        setUserCity(parts.length > 1 ? parts[parts.length - 1] : parts[0] || '')
      }
    }
  }, [profile.location])

  // Auto-detect location on mount: use profile coords or ask for GPS
  useEffect(() => {
    if (profile.latitude && profile.longitude) {
      setUserLocation({ lat: profile.latitude, lng: profile.longitude })
      detectCity(profile.latitude, profile.longitude)
    }
  }, [profile.latitude, profile.longitude, detectCity])

  const enableLocation = () => {
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setLocationLoading(false)
        detectCity(loc.lat, loc.lng)
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleRegister = async (campId: string) => {
    setRegistering(campId)
    setCampError('')
    try {
      await registerForCamp(user.id, campId)
      setRegistered(prev => new Set(prev).add(campId))
    } catch {
      setCampError('Failed to register. You may already be registered.')
    } finally {
      setRegistering(null)
    }
  }

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`
    if (km < 10) return `${km.toFixed(1)} km`
    return `${Math.round(km)} km`
  }

  return (
    <div className="space-y-8">
      {/* Donor Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-14">
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Blood Group</span>
            <Droplets className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{profile.blood_group}</p>
          <p className="text-xs text-gray-500 mt-1">Blood Donor</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Donations</span>
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">Total donations</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Last Donated</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">Never</p>
          <p className="text-xs text-gray-500 mt-1">Be the first!</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</span>
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <p className={`text-xl font-bold ${profile.is_available ? 'text-green-600' : 'text-yellow-600'}`}>
            {profile.is_available ? 'Available' : 'Unavailable'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{profile.is_available ? 'Ready to donate' : 'Not available now'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Nearby Camps — Register to Donate */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {userCity ? `Camps near ${userCity}` : 'Upcoming Donation Camps'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {userLocation
                    ? `Showing camps within ${campRadius} km of your location`
                    : 'Register for a camp near you to donate blood'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {userLocation && (
                  <select
                    value={campRadius}
                    onChange={e => setCampRadius(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                )}
                {!userLocation ? (
                  <button
                    onClick={enableLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                    Nearby
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-full border border-green-200">
                    <Navigation className="w-3 h-3" />
                    {userCity || 'Located'}
                  </span>
                )}
              </div>
            </div>

            {campError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {campError}
              </div>
            )}

            <div className="p-4">
              {loadingCamps ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600 mb-2" />
                  <p className="text-gray-500 text-sm">Loading camps...</p>
                </div>
              ) : camps.length > 0 ? (
                <div className="space-y-3">
                  {camps.slice(0, 5).map(camp => (
                    <div key={camp.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{camp.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              camp.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {camp.status}
                            </span>
                          </div>
                          {camp.description && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{camp.description}</p>
                          )}
                        </div>
                        {camp.distance !== undefined && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full whitespace-nowrap ml-3">
                            {formatDistance(camp.distance)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {camp.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-red-500" />
                          {new Date(camp.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' — '}
                          {new Date(camp.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-red-500" />
                          {camp.organizer_phone}
                        </span>
                      </div>

                      {registered.has(camp.id) ? (
                        <button disabled className="w-full bg-green-50 text-green-700 py-2 rounded-lg font-semibold text-sm border border-green-200 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Registered Successfully
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(camp.id)}
                          disabled={registering === camp.id}
                          className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:bg-red-300 transition flex items-center justify-center gap-1.5"
                        >
                          {registering === camp.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            <>
                              <Tent className="w-4 h-4" />
                              Register to Donate
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}

                  <Link
                    href="/camps"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    View All Camps
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tent className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  {userLocation ? (
                    <>
                      <p className="text-gray-500 font-medium">No camps found within {campRadius} km{userCity ? ` of ${userCity}` : ''}</p>
                      <p className="text-gray-400 text-sm mt-1">Try increasing the radius or check back later</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 font-medium">No upcoming camps found</p>
                      <p className="text-gray-400 text-sm mt-1">Check back later for new camps</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Donor Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Donor Actions</h3>
            </div>
            <div className="p-3">
              <Link href="/camps" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Tent className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">All Camps</p>
                  <p className="text-xs text-gray-500">Browse all donation camps</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link href="/blood-banks" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Blood Banks</p>
                  <p className="text-xs text-gray-500">Walk-in donation centres</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link href="/request-blood" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                  <Siren className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Blood Requests</p>
                  <p className="text-xs text-gray-500">See who needs blood</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Donor Tips */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-100 p-5">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Donor Tips
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Drink plenty of water before donating
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Eat iron-rich foods (spinach, beans)
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Get a good night&apos;s sleep
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Wait 56 days between donations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================
   RECIPIENT DASHBOARD
   ============================ */
function RecipientDashboard({ profile }: { profile: Profile }) {
  const { getDonorsByCity } = useDatabase()
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [nearbyDonors, setNearbyDonors] = useState<Profile[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingDonors, setLoadingDonors] = useState(true)
  const [receiverCity, setReceiverCity] = useState('')

  // Extract city name from profile location (e.g. "RS Puram, Coimbatore" → "Coimbatore")
  const extractCity = (location: string): string => {
    if (!location) return ''
    const parts = location.split(',').map(p => p.trim()).filter(Boolean)
    // Use the last meaningful part as city (usually "City" or "City, State")
    // For "Coimbatore" → "Coimbatore", for "RS Puram, Coimbatore" → "Coimbatore"
    return parts.length > 1 ? parts[parts.length - 1] : parts[0] || ''
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBloodRequests(undefined, 'open', 5)
        setRequests(data)
      } catch {
        // silent
      } finally {
        setLoadingRequests(false)
      }
    }
    load()
  }, [])

  // Fetch donors from same city as receiver
  useEffect(() => {
    const city = extractCity(profile.location)
    setReceiverCity(city)
    if (!city) {
      setLoadingDonors(false)
      return
    }
    const fetchDonors = async () => {
      setLoadingDonors(true)
      try {
        const compatibleGroups = getCompatibleGroups(profile.blood_group)
        const donors = await getDonorsByCity(city, compatibleGroups)
        setNearbyDonors(donors)
      } catch {
        // silent
      } finally {
        setLoadingDonors(false)
      }
    }
    fetchDonors()
  }, [profile.location, profile.blood_group, getDonorsByCity])

  return (
    <div className="space-y-8">
      {/* Recipient Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-14">
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Need</span>
            <Droplets className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{profile.blood_group}</p>
          <p className="text-xs text-gray-500 mt-1">Blood Needed</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Requests</span>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">Active requests</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Donors Found</span>
            <Search className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{nearbyDonors.length > 0 ? nearbyDonors.length : '--'}</p>
          <p className="text-xs text-gray-500 mt-1">{nearbyDonors.length > 0 ? 'Nearby donors' : 'Search to find donors'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</span>
            <MapPin className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">{profile.location}</p>
          <p className="text-xs text-gray-500 mt-1">Your area</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main — Search & Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Find Blood Fast */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Find Blood Quickly</h2>
              <p className="text-xs text-gray-500 mt-0.5">Search for donors or blood banks near you</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/search"
                  className="group flex flex-col items-center p-6 rounded-xl border-2 border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all"
                >
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                    <Search className="w-7 h-7 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Find Donors</h3>
                  <p className="text-xs text-gray-500 text-center">Search blood donors near your location by blood group</p>
                </Link>

                <Link
                  href="/blood-banks"
                  className="group flex flex-col items-center p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                >
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Blood Banks</h3>
                  <p className="text-xs text-gray-500 text-center">Find nearby blood banks and check available blood types</p>
                </Link>
              </div>

              <Link
                href="/request-blood"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25"
              >
                <Siren className="w-5 h-5" />
                Create Emergency Blood Request
              </Link>
            </div>
          </div>

          {/* Nearby Donors — Same City */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Donors in {receiverCity || 'Your City'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Compatible donors ({profile.blood_group}) in your city
                </p>
              </div>
              {receiverCity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-full border border-green-200">
                  <MapPin className="w-3 h-3" />
                  {receiverCity}
                </span>
              )}
            </div>
            <div className="p-4">
              {loadingDonors ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600 mb-2" />
                  <p className="text-gray-500 text-sm">Finding donors in {receiverCity || 'your city'}...</p>
                </div>
              ) : !receiverCity ? (
                <div className="text-center py-10">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No location set in your profile</p>
                  <p className="text-gray-400 text-sm mt-1">Update your profile with your city to see nearby donors</p>
                </div>
              ) : nearbyDonors.length > 0 ? (
                <div className="space-y-3">
                  {nearbyDonors.slice(0, 6).map(donor => (
                    <div key={donor.id} className="border border-gray-100 rounded-xl p-4 hover:border-red-200 hover:bg-red-50/30 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {donor.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{donor.full_name}</h3>
                            <p className="text-xs text-gray-500">Age: {donor.age}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                          {donor.blood_group}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {donor.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-red-500" />
                          {donor.phone}
                        </span>
                      </div>
                      <a
                        href={`tel:${donor.phone}`}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Contact Donor
                      </a>
                    </div>
                  ))}

                  {nearbyDonors.length > 6 && (
                    <Link
                      href="/search"
                      className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      View All {nearbyDonors.length} Donors
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No donors found in {receiverCity}</p>
                  <p className="text-gray-400 text-sm mt-1">Try searching manually for other areas</p>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Search Donors
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Open Requests */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Blood Requests</h2>
                <p className="text-xs text-gray-500 mt-0.5">Open requests in your area</p>
              </div>
              <Link href="/request-blood" className="text-sm font-semibold text-red-600 hover:text-red-700">
                View All
              </Link>
            </div>
            <div className="p-4">
              {loadingRequests ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600 mb-2" />
                  <p className="text-gray-500 text-sm">Loading requests...</p>
                </div>
              ) : requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                            {req.blood_group}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">{req.hospital_name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${
                          req.urgency === 'critical' ? 'bg-red-600' :
                          req.urgency === 'high' ? 'bg-orange-500' :
                          req.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          {req.urgency}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {req.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5" />
                          {req.units_needed} unit{req.units_needed > 1 ? 's' : ''} needed
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No open requests right now</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recipient Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-3">
              <Link href="/search" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Search className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Search Donors</p>
                  <p className="text-xs text-gray-500">Find donors by blood group</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link href="/request-blood" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                  <Siren className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Request Blood</p>
                  <p className="text-xs text-gray-500">Create an urgent request</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link href="/blood-banks" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Blood Banks</p>
                  <p className="text-xs text-gray-500">Find nearby blood banks</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link href="/camps" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Tent className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Donation Camps</p>
                  <p className="text-xs text-gray-500">Camps collecting blood</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Compatible Blood Groups */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Compatible Blood Groups
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Your blood group <strong>{profile.blood_group}</strong> can receive from:
            </p>
            <div className="flex flex-wrap gap-2">
              {getCompatibleGroups(profile.blood_group).map(group => (
                <span key={group} className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold text-red-700 border border-blue-200 shadow-sm">
                  {group}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCompatibleGroups(bloodGroup: string): string[] {
  const compatibility: Record<string, string[]> = {
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
  }
  return compatibility[bloodGroup] || []
}

/* ============================
   MAIN DASHBOARD
   ============================ */
export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { getProfile, updateProfile } = useDatabase()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    full_name: '',
    age: '',
    phone: '',
    location: '',
    is_available: true,
  })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        const profileData = await getProfile(user.id)
        if (profileData && !profileData.blood_group) {
          router.push('/auth/complete-profile')
          return
        }
        setProfile(profileData)
      } catch (err) {
        console.error('Error loading profile:', err)
      }

      setLoading(false)
    }

    checkAuth()
  }, [user, authLoading, router])

  const openEdit = () => {
    if (!profile) return
    setEditData({
      full_name: profile.full_name,
      age: String(profile.age),
      phone: profile.phone,
      location: profile.location,
      is_available: profile.is_available,
    })
    setEditMode(true)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!user || !profile) return
    setSaving(true)
    try {
      const updated = await updateProfile(user.id, {
        full_name: editData.full_name.trim(),
        age: parseInt(editData.age),
        phone: editData.phone.trim(),
        location: editData.location.trim(),
        is_available: editData.is_available,
      })
      if (updated) {
        setProfile(updated)
        setSaveSuccess(true)
        setTimeout(() => {
          setEditMode(false)
          setSaveSuccess(false)
        }, 1200)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile not found</h2>
          <p className="text-gray-500 mb-6">Please complete your registration first.</p>
          <Link href="/auth/register" className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors">
            Register Now
          </Link>
        </div>
      </div>
    )
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner — Red for Donor, Blue for Recipient */}
      <div className={`text-white ${
        profile.is_donor
          ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800'
          : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <ProfileAvatar name={profile.full_name} />
              <div>
                <p className={`text-sm font-medium ${profile.is_donor ? 'text-red-200' : 'text-blue-200'}`}>
                  {greeting()}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold">{profile.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${profile.is_donor ? 'text-red-200' : 'text-blue-200'}`}>{profile.email}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white">
                    {profile.is_donor ? 'DONOR' : 'RECIPIENT'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-semibold">
                <Droplets className="w-4 h-4" />
                {profile.blood_group}
              </span>
              {profile.is_donor && (
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${
                  profile.is_available
                    ? 'bg-green-500/20 text-green-100'
                    : 'bg-yellow-500/20 text-yellow-100'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${profile.is_available ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {profile.is_available ? 'Available' : 'Unavailable'}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            <button
              onClick={() => { setActiveTab('overview'); setEditMode(false) }}
              className={`px-5 py-2 rounded-t-xl text-sm font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-gray-50 text-gray-900'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {profile.is_donor ? 'Donor Dashboard' : 'Recipient Dashboard'}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-2 rounded-t-xl text-sm font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-gray-50 text-gray-900'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              My Profile
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab — Role-Based */}
        {activeTab === 'overview' && user && (
          profile.is_donor
            ? <DonorDashboard profile={profile} user={{ id: user.id }} />
            : <RecipientDashboard profile={profile} />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">My Profile</h2>
                {!editMode ? (
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>

              {!editMode ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Name</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Age</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.age} years</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Blood Group</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.blood_group}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Type</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">{profile.is_donor ? 'Blood Donor' : 'Blood Recipient'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Member Since</p>
                        <p className="text-base font-semibold text-gray-900 mt-0.5">
                          {new Date(profile.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Profile updated successfully!
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={editData.full_name}
                        onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age</label>
                      <input
                        type="number"
                        value={editData.age}
                        onChange={e => setEditData(d => ({ ...d, age: e.target.value }))}
                        min="18"
                        max="65"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    {profile.is_donor && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Availability</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditData(d => ({ ...d, is_available: true }))}
                            className={`flex-1 py-2.5 rounded-xl font-semibold border-2 transition-all ${
                              editData.is_available
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            Available to Donate
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditData(d => ({ ...d, is_available: false }))}
                            className={`flex-1 py-2.5 rounded-xl font-semibold border-2 transition-all ${
                              !editData.is_available
                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            Not Available
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-5 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
