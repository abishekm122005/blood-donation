'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, X, Loader2 } from 'lucide-react'
import L from 'leaflet'

interface LocationPickerProps {
  latitude: string
  longitude: string
  onLocationSelect: (lat: string, lng: string) => void
}

function MapPickerModal({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: {
  initialLat: number
  initialLng: number
  onConfirm: (lat: number, lng: number) => void
  onClose: () => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [selectedLat, setSelectedLat] = useState(initialLat)
  const [selectedLng, setSelectedLng] = useState(initialLng)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 13)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })

    const marker = L.marker([initialLat, initialLng], { icon, draggable: true }).addTo(map)
    markerRef.current = marker

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setSelectedLat(pos.lat)
      setSelectedLng(pos.lng)
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setSelectedLat(lat)
      setSelectedLng(lng)
    })

    // Fix tile rendering after modal open
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pick Location on Map</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click on the map or drag the marker to select a location</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={mapRef} className="w-full h-[400px]" />

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Lat:</span> {selectedLat.toFixed(6)}&nbsp;&nbsp;
            <span className="font-medium">Lng:</span> {selectedLng.toFixed(6)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedLat, selectedLng)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LocationPicker({ latitude, longitude, onLocationSelect }: LocationPickerProps) {
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [locationError, setLocationError] = useState('')

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSelect(
          position.coords.latitude.toFixed(6),
          position.coords.longitude.toFixed(6)
        )
        setGettingLocation(false)
      },
      (err) => {
        setGettingLocation(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please allow location access.')
            break
          case err.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.')
            break
          case err.TIMEOUT:
            setLocationError('Location request timed out.')
            break
          default:
            setLocationError('Failed to get your location.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleMapConfirm = (lat: number, lng: number) => {
    onLocationSelect(lat.toFixed(6), lng.toFixed(6))
    setShowMap(false)
  }

  const mapCenter = {
    lat: parseFloat(latitude) || 11.1085,
    lng: parseFloat(longitude) || 77.3411,
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={gettingLocation}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm font-semibold hover:bg-blue-100 hover:border-blue-300 transition disabled:opacity-50"
        >
          {gettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
        </button>
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-green-200 text-green-700 bg-green-50 rounded-xl text-sm font-semibold hover:bg-green-100 hover:border-green-300 transition"
        >
          <MapPin className="w-4 h-4" />
          Pick from Map
        </button>
      </div>

      {locationError && (
        <p className="text-red-500 text-xs mt-1.5">{locationError}</p>
      )}

      {showMap && (
        <MapPickerModal
          initialLat={mapCenter.lat}
          initialLng={mapCenter.lng}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  )
}
