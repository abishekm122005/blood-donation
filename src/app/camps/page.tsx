'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDonationCamps, registerForCamp, calculateDistance } from '@/lib/database'
import { useAuth } from '@/components/AuthProvider'
import { DonationCamp } from '@/types/database'
import {
  MapPin, User, Phone, Calendar, Navigation, Loader2,
  AlertCircle, Check, LocateFixed, ArrowUpDown
} from 'lucide-react'

interface CampWithDistance extends DonationCamp {
  distance?: number
}

export default function DonationCamps() {
  const { user } = useAuth()
  const [camps, setCamps] = useState<CampWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('upcoming')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const [registered, setRegistered] = useState<Set<string>>(new Set())

  const sortCampsByDistance = useCallback(
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

  const loadCamps = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDonationCamps(filterStatus === 'all' ? undefined : filterStatus)
      const sorted = sortCampsByDistance(data as CampWithDistance[], userLocation)
      setCamps(sorted)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load camps'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, userLocation, sortCampsByDistance])

  useEffect(() => {
    loadCamps()
  }, [loadCamps])

  // Re-sort when location changes
  useEffect(() => {
    if (userLocation && camps.length > 0) {
      setCamps(prev => sortCampsByDistance(prev, userLocation))
    }
  }, [userLocation, sortCampsByDistance]) // eslint-disable-line react-hooks/exhaustive-deps

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationEnabled(true)
        setLocationLoading(false)
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied. Please enable location access in your browser settings.'
            : 'Failed to get your location. Please try again.'
        )
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const disableLocation = () => {
    setUserLocation(null)
    setLocationEnabled(false)
    // Remove distance from camps
    setCamps(prev => prev.map(c => ({ ...c, distance: undefined })))
  }

  const handleRegister = async (campId: string) => {
    if (!user) {
      setError('Please log in to register for a camp')
      return
    }
    setRegistering(campId)
    try {
      await registerForCamp(user.id, campId)
      setRegistered(prev => new Set(prev).add(campId))
    } catch {
      setError('Failed to register. You may already be registered for this camp.')
    } finally {
      setRegistering(null)
    }
  }

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m away`
    if (km < 10) return `${km.toFixed(1)} km away`
    return `${Math.round(km)} km away`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Donation Camps</h1>
          <p className="text-gray-500">Find and register for blood donation camps near you</p>
        </div>

        {/* Location Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          {!locationEnabled ? (
            <button
              onClick={enableLocation}
              disabled={locationLoading}
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50"
            >
              {locationLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LocateFixed className="w-5 h-5" />
              )}
              {locationLoading ? 'Getting location...' : 'Show Nearby Camps'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                <Navigation className="w-4 h-4" />
                Live location active
                <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-green-500" />
                <span className="text-green-500">Sorted by distance</span>
              </div>
              <button
                onClick={disableLocation}
                className="px-3 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Turn off
              </button>
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {(['all', 'upcoming', 'ongoing', 'completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                filterStatus === status
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600 text-xs font-medium">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
            <p className="text-gray-500">Loading camps...</p>
          </div>
        ) : camps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {camps.map(camp => (
              <div
                key={camp.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{camp.name}</h3>
                    {camp.description && (
                      <p className="text-gray-500 text-sm mt-1">{camp.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <span className={`px-3 py-1 rounded-full font-semibold text-white text-xs ${
                      camp.status === 'upcoming' ? 'bg-blue-600' :
                      camp.status === 'ongoing' ? 'bg-green-600' : 'bg-gray-500'
                    }`}>
                      {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                    </span>
                    {camp.distance !== undefined && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                        {formatDistance(camp.distance)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 mb-5 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2.5 text-red-500 shrink-0" />
                    <span>{camp.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2.5 text-red-500 shrink-0" />
                    <span>
                      {new Date(camp.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' — '}
                      {new Date(camp.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2.5 text-red-500 shrink-0" />
                    <span>{camp.organizer_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2.5 text-red-500 shrink-0" />
                    <span>{camp.organizer_phone}</span>
                  </div>
                </div>

                {registered.has(camp.id) ? (
                  <button disabled className="w-full bg-green-50 text-green-700 py-2.5 rounded-xl font-semibold border-2 border-green-200 flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Registered
                  </button>
                ) : camp.status === 'completed' ? (
                  <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl font-semibold cursor-not-allowed">
                    Camp Completed
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(camp.id)}
                    disabled={registering === camp.id}
                    className="w-full bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 transition flex items-center justify-center gap-2"
                  >
                    {registering === camp.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register to Donate'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No camps found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different filter or check back later</p>
          </div>
        )}
      </div>
    </div>
  )
}