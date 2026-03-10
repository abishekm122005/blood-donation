'use client'

import { useState, useEffect, useCallback } from 'react'
import { searchDonors, calculateDistance } from '@/lib/database'
import { Profile } from '@/types/database'
import { MapPin, Phone, Heart, LocateFixed, Loader2, Navigation } from 'lucide-react'

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

interface DonorWithDistance extends Profile {
  distance?: number
}

export default function SearchDonors() {
  const [bloodGroup, setBloodGroup] = useState('')
  const [allDonors, setAllDonors] = useState<DonorWithDistance[]>([])
  const [donors, setDonors] = useState<DonorWithDistance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userCity, setUserCity] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [searchRadius, setSearchRadius] = useState(25)

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

  // Recompute filtered donors when location, radius, or allDonors change
  useEffect(() => {
    if (!userLocation) {
      setDonors(allDonors)
      return
    }
    const withDistance = allDonors
      .map(d => ({
        ...d,
        distance:
          d.latitude && d.longitude
            ? calculateDistance(userLocation.lat, userLocation.lng, d.latitude, d.longitude)
            : undefined,
      }))
      .filter(d => d.distance !== undefined && d.distance <= searchRadius)
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    setDonors(withDistance)
  }, [allDonors, userLocation, searchRadius])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSearched(true)

    if (!bloodGroup) {
      setError('Please select a blood group')
      return
    }

    if (!locationEnabled || !userLocation) {
      setError('Please enable your location to search for nearby donors')
      return
    }

    setLoading(true)
    try {
      const results = await searchDonors(
        bloodGroup,
        userCity || '',
        userLocation.lat,
        userLocation.lng,
        searchRadius
      )
      setAllDonors(results as DonorWithDistance[])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search donors'
      setError(message)
    } finally {
      setLoading(false)
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
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">Find Blood Donors</h1>
        {userCity && (
          <p className="text-center text-gray-500 mb-8">
            <Navigation className="inline w-4 h-4 mr-1" />
            Searching near <span className="font-semibold text-gray-700">{userCity}</span>
          </p>
        )}

        {/* Location & Search Controls */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          {/* Location Button */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
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
                  value={searchRadius}
                  onChange={e => setSearchRadius(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                >
                  {[5, 10, 25, 50, 100].map(r => (
                    <option key={r} value={r}>{r} km</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !locationEnabled}
              className="px-8 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {searched && !loading && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Found {donors.length} donor{donors.length !== 1 ? 's' : ''}
              {userCity ? ` within ${searchRadius} km of ${userCity}` : ''}
            </h2>

            {donors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donors.map(donor => (
                  <div key={donor.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{donor.full_name}</h3>
                        <p className="text-sm text-gray-600">Age: {donor.age}</p>
                      </div>
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-lg">
                        {donor.blood_group}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donor.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-red-600 hover:underline"
                      >
                        <MapPin size={16} className="mr-2 text-red-600" />
                        <span className="text-sm">{donor.location}</span>
                      </a>
                      {donor.distance !== undefined && (
                        <div className="flex items-center text-gray-500">
                          <Navigation size={16} className="mr-2 text-red-400" />
                          <span className="text-sm">{formatDistance(donor.distance)}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-700">
                        <Phone size={16} className="mr-2 text-red-600" />
                        <span className="text-sm">{donor.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Heart size={16} className="mr-2 text-red-600" />
                        <span className="text-sm">Available</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${donor.phone}`}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 text-center flex items-center justify-center gap-1.5"
                      >
                        <Phone size={16} />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${donor.full_name}, I found you on BloodConnect. I need ${bloodGroup || 'blood'} urgently. Can you help?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-center flex items-center justify-center gap-1.5"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No donors found within {searchRadius} km{userCity ? ` of ${userCity}` : ''}
                </p>
                <p className="text-gray-400 text-sm mt-1">Try increasing the radius or selecting a different blood group</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}