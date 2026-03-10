'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAdminCamps,
  createDonationCamp,
  updateDonationCamp,
  deleteDonationCamp,
} from '@/app/actions/admin'
import { DonationCamp } from '@/types/database'
import {
  Plus, Edit2, Trash2, MapPin, Calendar, User, Phone,
  AlertCircle, Check, Loader2, ArrowLeft, X, Shield
} from 'lucide-react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })

const EMPTY_FORM = {
  name: '',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  start_date: '',
  end_date: '',
  organizer_name: '',
  organizer_phone: '',
  status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed',
}

export default function AdminCamps() {
  const router = useRouter()
  const [adminPassword, setAdminPassword] = useState('')
  const [camps, setCamps] = useState<DonationCamp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCamp, setEditingCamp] = useState<DonationCamp | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadCamps = useCallback(async (pw: string) => {
    setLoading(true)
    const result = await getAdminCamps(pw)
    if (result.success) {
      setCamps(result.data as DonationCamp[])
    } else {
      setError(result.error || 'Failed to load camps')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const pw = sessionStorage.getItem('adminAuth')
    if (!pw) {
      router.push('/admin')
      return
    }
    setAdminPassword(pw)
    loadCamps(pw)
  }, [router, loadCamps])

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const openAddForm = () => {
    setEditingCamp(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
    setError('')
  }

  const openEditForm = (camp: DonationCamp) => {
    setEditingCamp(camp)
    setFormData({
      name: camp.name,
      description: camp.description || '',
      location: camp.location,
      latitude: camp.latitude?.toString() || '',
      longitude: camp.longitude?.toString() || '',
      start_date: camp.start_date ? new Date(camp.start_date).toISOString().slice(0, 16) : '',
      end_date: camp.end_date ? new Date(camp.end_date).toISOString().slice(0, 16) : '',
      organizer_name: camp.organizer_name,
      organizer_phone: camp.organizer_phone,
      status: camp.status,
    })
    setShowForm(true)
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCamp(null)
    setFormData(EMPTY_FORM)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) { setError('Camp name is required'); return }
    if (!formData.location.trim()) { setError('Location is required'); return }
    if (!formData.latitude || !formData.longitude) { setError('Latitude and longitude are required'); return }
    if (!formData.start_date) { setError('Start date is required'); return }
    if (!formData.end_date) { setError('End date is required'); return }
    if (!formData.organizer_name.trim()) { setError('Organizer name is required'); return }
    if (!formData.organizer_phone.trim()) { setError('Organizer phone is required'); return }

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    if (isNaN(lat) || lat < -90 || lat > 90) { setError('Latitude must be between -90 and 90'); return }
    if (isNaN(lng) || lng < -180 || lng > 180) { setError('Longitude must be between -180 and 180'); return }

    setSubmitting(true)

    const campPayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      location: formData.location.trim(),
      latitude: lat,
      longitude: lng,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      organizer_name: formData.organizer_name.trim(),
      organizer_phone: formData.organizer_phone.trim(),
      status: formData.status,
    }

    let result
    if (editingCamp) {
      result = await updateDonationCamp(adminPassword, editingCamp.id, campPayload)
    } else {
      result = await createDonationCamp(adminPassword, campPayload)
    }

    if (result.success) {
      setSuccess(editingCamp ? 'Camp updated successfully!' : 'Camp created successfully!')
      closeForm()
      loadCamps(adminPassword)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || 'Operation failed')
    }

    setSubmitting(false)
  }

  const handleDelete = async (campId: string) => {
    setError('')
    const result = await deleteDonationCamp(adminPassword, campId)
    if (result.success) {
      setSuccess('Camp deleted successfully!')
      setDeleteConfirm(null)
      loadCamps(adminPassword)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || 'Failed to delete camp')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-gray-800" />
            <h1 className="text-xl font-bold text-gray-900">Admin — Donation Camps</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddForm}
              className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Camp
            </button>
            <button
              onClick={handleLogout}
              className="border-2 border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {error && !showForm && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCamp ? 'Edit Camp' : 'Add New Camp'}
                </h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Camp Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Annual Blood Donation Drive"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors resize-none"
                    placeholder="Brief description of the camp..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location (Address) *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="City Hall, Main Street, Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Set Coordinates</label>
                  <LocationPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationSelect={(lat, lng) => {
                      updateField('latitude', lat)
                      updateField('longitude', lng)
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => updateField('latitude', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="19.0760"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => updateField('longitude', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="72.8777"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => updateField('end_date', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organizer Name *</label>
                    <input
                      type="text"
                      value={formData.organizer_name}
                      onChange={(e) => updateField('organizer_name', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="Red Cross Society"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organizer Phone *</label>
                    <input
                      type="tel"
                      value={formData.organizer_phone}
                      onChange={(e) => updateField('organizer_phone', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <div className="flex gap-3">
                    {(['upcoming', 'ongoing', 'completed'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateField('status', s)}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                          formData.status === s
                            ? s === 'upcoming'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : s === 'ongoing'
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-600 bg-gray-50 text-gray-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {editingCamp ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingCamp ? 'Update Camp' : 'Create Camp'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Camps list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : camps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No camps yet</h3>
            <p className="text-gray-500 mb-6">Click &quot;Add Camp&quot; to create your first donation camp.</p>
            <button
              onClick={openAddForm}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Camp
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {camps.map(camp => (
              <div key={camp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{camp.name}</h3>
                    {camp.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{camp.description}</p>
                    )}
                  </div>
                  <span className={`ml-3 shrink-0 px-3 py-1 rounded-full font-semibold text-white text-xs ${
                    camp.status === 'upcoming' ? 'bg-blue-600' :
                    camp.status === 'ongoing' ? 'bg-green-600' : 'bg-gray-500'
                  }`}>
                    {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-red-500 shrink-0" />
                    <span className="truncate">{camp.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-red-500 shrink-0" />
                    <span>
                      {new Date(camp.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' — '}
                      {new Date(camp.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2 text-red-500 shrink-0" />
                    <span>{camp.organizer_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-red-500 shrink-0" />
                    <span>{camp.organizer_phone}</span>
                  </div>
                  {camp.latitude && camp.longitude && (
                    <div className="text-gray-400 text-xs">
                      Coordinates: {camp.latitude}, {camp.longitude}
                    </div>
                  )}
                </div>

                {deleteConfirm === camp.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(camp.id)}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(camp)}
                      className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(camp.id)}
                      className="flex-1 border-2 border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
