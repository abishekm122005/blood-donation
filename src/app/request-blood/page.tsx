'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { createBloodRequest, getBloodRequests } from '@/lib/database'
import { BloodRequest, BloodGroup } from '@/types/database'
import { AlertCircle, MapPin, Droplet, Clock, LocateFixed, Loader2 } from 'lucide-react'

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical']

export default function RequestBlood() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create')
  const [formData, setFormData] = useState({
    bloodGroup: '',
    unitsNeeded: '1',
    hospitalName: '',
    location: '',
    urgency: 'high',
    description: '',
  })
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (activeTab === 'view') {
      loadRequests()
    }
  }, [activeTab])

  const loadRequests = async () => {
    try {
      const data = await getBloodRequests('', 'open')
      setRequests(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load requests')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setLocationLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserCoords({ lat: latitude, lng: longitude })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          if (data.address) {
            const addr = data.address
            const locationStr = [addr.city || addr.town || addr.village, addr.state].filter(Boolean).join(', ')
            setFormData(prev => ({ ...prev, location: locationStr || data.display_name }))
          }
        } catch {
          // coordinates saved even if reverse geocoding fails
        } finally {
          setLocationLoading(false)
        }
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied. Please allow location access or type the address manually.'
            : 'Failed to detect location. Please type the address manually.'
        )
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!user) {
        setError('You must be logged in to request blood')
        setLoading(false)
        return
      }

      const latitude = userCoords?.lat ?? 0
      const longitude = userCoords?.lng ?? 0

      const newRequest = await createBloodRequest({
        requester_id: user.id,
        blood_group: formData.bloodGroup as BloodGroup,
        units_needed: parseInt(formData.unitsNeeded),
        hospital_name: formData.hospitalName,
        location: formData.location,
        latitude,
        longitude,
        urgency: formData.urgency as any,
        description: formData.description,
      })

      setSuccess('Blood request created successfully!')
      setFormData({
        bloodGroup: '',
        unitsNeeded: '1',
        hospitalName: '',
        location: '',
        urgency: 'high',
        description: '',
      })

      setTimeout(() => {
        setActiveTab('view')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create blood request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Emergency Blood Request</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'create'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            Create Request
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'view'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            View Requests
          </button>
        </div>

        {/* Create Request Tab */}
        {activeTab === 'create' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <p className="text-blue-800">
                Your request will be immediately visible to nearby available donors in your area
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group Needed
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units Needed
                  </label>
                  <input
                    type="number"
                    name="unitsNeeded"
                    value={formData.unitsNeeded}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="University Hospital"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location/Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Coimbatore, Tamil Nadu"
                    />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locationLoading}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center gap-1 shrink-0"
                      title="Use my current location"
                    >
                      {locationLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LocateFixed className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {userCoords && (
                    <a
                      href={`https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-600 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      View on Map
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    {URGENCY_LEVELS.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Any additional details about the patient or emergency..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 text-lg"
              >
                {loading ? 'Creating Request...' : 'Create Blood Request'}
              </button>
            </form>
          </div>
        )}

        {/* View Requests Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {requests.length > 0 ? (
              requests.map(request => (
                <div key={request.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{request.hospital_name}</h3>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.hospital_name + ', ' + request.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-red-600 hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-4 h-4" />
                        {request.location}
                      </a>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full font-semibold text-white ${
                      request.urgency === 'critical' ? 'bg-red-600' :
                      request.urgency === 'high' ? 'bg-orange-600' :
                      request.urgency === 'medium' ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}>
                      {request.urgency.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-gray-700">
                      <Droplet className="w-5 h-5 mr-2 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-500">Blood Group</p>
                        <p className="font-semibold">{request.blood_group}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Droplet className="w-5 h-5 mr-2 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Units Needed</p>
                        <p className="font-semibold">{request.units_needed}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-5 h-5 mr-2 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Posted</p>
                        <p className="font-semibold">{new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {request.description && (
                    <p className="text-gray-600 mb-4">{request.description}</p>
                  )}

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `🚨 *Emergency Blood Request*\n\n🏥 Hospital: ${request.hospital_name}\n📍 Location: ${request.location}\n🩸 Blood Group: ${request.blood_group}\n💉 Units Needed: ${request.units_needed}\n⚡ Urgency: ${request.urgency.toUpperCase()}\n📅 Posted: ${new Date(request.created_at).toLocaleDateString()}${request.description ? `\n📝 Details: ${request.description}` : ''}\n\nPlease help if you can donate! 🙏`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Contact Donors
                  </a>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <p className="text-gray-600 text-lg">No open blood requests at the moment</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}