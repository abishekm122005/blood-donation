'use client'

import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock } from 'lucide-react'

interface BloodBankData {
  id: string
  name: string
  address: string
  phone: string
  latitude: number
  longitude: number
  city: string
  available_blood_types: string
  operating_hours: string
}

const MOCK_BLOOD_BANKS: BloodBankData[] = [
  {
    id: '1',
    name: 'Central Blood Bank',
    address: '123 Medical Ave, New York, NY 10001',
    phone: '+1 (212) 555-0123',
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    available_blood_types: 'O+, O-, A+, A-, B+, B-, AB+, AB-',
    operating_hours: '24/7',
  },
  {
    id: '2',
    name: 'Red Cross Blood Center',
    address: '456 Health St, New York, NY 10002',
    phone: '+1 (212) 555-0456',
    latitude: 40.7138,
    longitude: -74.0010,
    city: 'New York',
    available_blood_types: 'O+, A+, B+, AB+, O-, A-',
    operating_hours: '6 AM - 10 PM',
  },
  {
    id: '3',
    name: 'City Hospital Blood Bank',
    address: '789 Care Lane, New York, NY 10003',
    phone: '+1 (212) 555-0789',
    latitude: 40.7180,
    longitude: -74.0020,
    city: 'New York',
    available_blood_types: 'O+, O-, A+, B+, AB+',
    operating_hours: '8 AM - 8 PM',
  },
]

export default function BloodBanks() {
  const [banks, setBanks] = useState<BloodBankData[]>(MOCK_BLOOD_BANKS)
  const [searchCity, setSearchCity] = useState('')
  const [filteredBanks, setFilteredBanks] = useState<BloodBankData[]>(MOCK_BLOOD_BANKS)

  useEffect(() => {
    if (searchCity) {
      setFilteredBanks(
        banks.filter(bank => bank.city.toLowerCase().includes(searchCity.toLowerCase()))
      )
    } else {
      setFilteredBanks(banks)
    }
  }, [searchCity, banks])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Blood Banks & Hospitals</h1>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700">
              Search
            </button>
          </div>
        </div>

        {/* Blood Banks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBanks.map(bank => (
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

        {filteredBanks.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">No blood banks found in {searchCity}</p>
          </div>
        )}
      </div>
    </div>
  )
}