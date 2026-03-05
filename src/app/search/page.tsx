'use client'

import { useState } from 'react'
import { searchDonors } from '@/lib/database'
import { Profile } from '@/types/database'
import { MapPin, Phone, Heart } from 'lucide-react'

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export default function SearchDonors() {
  const [formData, setFormData] = useState({
    bloodGroup: '',
    location: '',
    radius: '10',
  })
  const [donors, setDonors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSearched(true)

    try {
      if (!formData.bloodGroup || !formData.location) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      // Get current user location (simulated for now)
      const latitude = 40.7128 // New York latitude
      const longitude = -74.0060 // New York longitude

      const results = await searchDonors(
        formData.bloodGroup,
        formData.location,
        latitude,
        longitude,
        parseInt(formData.radius)
      )

      setDonors(results)
    } catch (err: any) {
      setError(err.message || 'Failed to search donors')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">Find Blood Donors</h1>

        {/* Search Form */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
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
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City or Area"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius (km)
                </label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Found {donors.length} donor{donors.length !== 1 ? 's' : ''}
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
                      <div className="flex items-center text-gray-700">
                        <MapPin size={16} className="mr-2 text-red-600" />
                        <span className="text-sm">{donor.location}</span>
                      </div>
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
                      <button className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700">
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <p className="text-gray-600 text-lg">No donors found. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}