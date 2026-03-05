'use client'

import { useState, useEffect } from 'react'
import { getDonationCamps, registerForCamp } from '@/lib/database'
import { DonationCamp } from '@/types/database'
import { MapPin, User, Phone, Calendar } from 'lucide-react'

export default function DonationCamps() {
  const [camps, setCamps] = useState<DonationCamp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('upcoming')

  useEffect(() => {
    loadCamps()
  }, [filterStatus])

  const loadCamps = async () => {
    setLoading(true)
    try {
      const data = await getDonationCamps(filterStatus === 'all' ? undefined : filterStatus)
      setCamps(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load camps')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Donation Camps</h1>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {['all', 'upcoming', 'ongoing', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-6 py-2 rounded-lg font-semibold ${
                filterStatus === status
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Loading camps...</div>
        ) : camps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {camps.map(camp => (
              <div key={camp.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{camp.name}</h3>
                    <p className="text-gray-600 text-sm">{camp.description}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full font-semibold text-white text-sm ${
                    camp.status === 'upcoming' ? 'bg-blue-600' :
                    camp.status === 'ongoing' ? 'bg-green-600' :
                    'bg-gray-600'
                  }`}>
                    {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-2 text-red-600" />
                    <span>{camp.location}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-2 text-red-600" />
                    <span>
                      {new Date(camp.start_date).toLocaleDateString()} - {new Date(camp.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <User className="w-5 h-5 mr-2 text-red-600" />
                    <span>{camp.organizer_name}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-5 h-5 mr-2 text-red-600" />
                    <span>{camp.organizer_phone}</span>
                  </div>
                </div>

                <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700">
                  Register to Donate
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">No camps found</p>
          </div>
        )}
      </div>
    </div>
  )
}