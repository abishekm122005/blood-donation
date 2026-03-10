'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Phone, Clock, LocateFixed, Loader2, Navigation, Building2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { BloodBank } from '@/types/database'
import { calculateDistance } from '@/lib/database'

interface BloodBankWithDistance extends BloodBank {
  distance?: number
}

export default function BloodBanks() {
  const [allBanks, setAllBanks] = useState<BloodBankWithDistance[]>([])
  const [banks, setBanks] = useState<BloodBankWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userCity, setUserCity] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [bankRadius, setBankRadius] = useState(25)

  // Load blood banks from Supabase
  const loadBanks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase
        .from('blood_banks')
        .select('*')
        .order('name', { ascending: true })

      if (err) throw err
      setAllBanks((data as BloodBankWithDistance[]) || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load blood banks'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBanks()
  }, [loadBanks])

  // Recompute filtered banks when location, radius, or allBanks change
  useEffect(() => {
    if (!userLocation) {
      setBanks(allBanks.map(b => ({ ...b, distance: undefined })))
      return
    }
    const withDistance = allBanks
      .map(b => ({
        ...b,
        distance:
          b.latitude && b.longitude
            ? calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
            : undefined,
      }))
      .filter(b => b.distance !== undefined && b.distance <= bankRadius)
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    setBanks(withDistance)
  }, [allBanks, userLocation, bankRadius])

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
      // silent
    }
  }, [])

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserLocation(loc)
        setLocationEnabled(true)
        setLocationLoading(false)
        detectCity(loc.lat, loc.lng)
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied. Please enable location access.'
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
    setUserCity('')
  }

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m away`
    if (km < 10) return `${km.toFixed(1)} km away`
    return `${Math.round(km)} km away`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">Blood Banks &amp; Hospitals</h1>
        {userCity && (
          <p className="text-center text-gray-500 mb-8">
            <Navigation className="inline w-4 h-4 mr-1" />
            Near <span className="font-semibold text-gray-700">{userCity}</span>
          </p>
        )}

        {/* Location Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {!locationEnabled ? (
              <button
                onClick={enableLocation}
                disabled={locationLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                {locationLoading ? 'Detecting...' : 'Use My Location'}
              </button>
            ) : (
              <button
                onClick={disableLocation}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                <LocateFixed className="w-4 h-4" />
                Disable Location
              </button>
            )}

            {locationEnabled && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Radius:</label>
                <select
                  value={bankRadius}
                  onChange={e => setBankRadius(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                >
                  {[5, 10, 25, 50, 100].map(r => (
                    <option key={r} value={r}>{r} km</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="ml-3 text-gray-600">Loading blood banks...</span>
          </div>
        )}

        {/* Blood Banks List */}
        {!loading && banks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banks.map(bank => (
              <div key={bank.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{bank.name}</h3>

                <div className="space-y-3 mb-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bank.name + ', ' + bank.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start text-gray-700 hover:text-red-600 hover:underline"
                  >
                    <MapPin className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{bank.address}</span>
                  </a>
                  {bank.distance !== undefined && (
                    <div className="flex items-center text-gray-500">
                      <Navigation className="w-5 h-5 mr-2 text-red-400" />
                      <span className="text-sm">{formatDistance(bank.distance)}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-5 h-5 mr-2 text-red-600" />
                    <a href={`tel:${bank.phone}`} className="hover:underline">
                      {bank.phone}
                    </a>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-2 text-red-600" />
                    <span>{bank.operating_hours}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Available Blood Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {bank.available_blood_types.split(', ').map(type => (
                      <span
                        key={type}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bank.name + ', ' + bank.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 text-center"
                >
                  View on Map
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && banks.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            {locationEnabled ? (
              <>
                <p className="text-gray-500 text-lg">No blood banks found within {bankRadius} km{userCity ? ` of ${userCity}` : ''}</p>
                <p className="text-gray-400 text-sm mt-1">Try increasing the radius</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg">No blood banks found</p>
                <p className="text-gray-400 text-sm mt-1">Enable your location to find nearby blood banks</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}