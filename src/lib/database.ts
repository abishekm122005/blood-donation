import { getSupabaseClient } from './supabase'
import { Profile, BloodRequest, DonationCamp, Notification } from '@/types/database'

// Profile Functions
export async function getProfile(userId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data as Profile
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data as Profile
}

// Blood Donor Search
export async function searchDonors(
  bloodGroup: string,
  location: string,
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('blood_group', bloodGroup)
    .eq('is_available', true)
    .eq('is_donor', true)
  
  if (error) throw error
  
  // Filter by distance (basic filtering - more sophisticated filtering can be done client-side)
  const donors = (data as Profile[]).filter(donor => {
    const distance = calculateDistance(latitude, longitude, donor.latitude, donor.longitude)
    return distance <= radiusKm
  })
  
  return donors
}

// Blood Request Functions
export async function createBloodRequest(request: Partial<BloodRequest>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('blood_requests')
    .insert([request])
    .select()
    .single()
  
  if (error) throw error
  return data as BloodRequest
}

export async function getBloodRequests(
  bloodGroup?: string,
  status?: string,
  limit: number = 50
) {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (bloodGroup) query = query.eq('blood_group', bloodGroup)
  if (status) query = query.eq('status', status)
  
  const { data, error } = await query
  
  if (error) throw error
  return data as BloodRequest[]
}

export async function updateBloodRequest(
  requestId: string,
  updates: Partial<BloodRequest>
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('blood_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single()
  
  if (error) throw error
  return data as BloodRequest
}

// Donation Camp Functions
export async function getDonationCamps(status?: string) {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('donation_camps')
    .select('*')
    .order('start_date', { ascending: true })
  
  if (status) query = query.eq('status', status)
  
  const { data, error } = await query
  
  if (error) throw error
  return data as DonationCamp[]
}

export async function registerForCamp(donorId: string, campId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('camp_registrations')
    .insert([{ donor_id: donorId, camp_id: campId }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Notification Functions
export async function getNotifications(userId: string, unreadOnly: boolean = false) {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (unreadOnly) query = query.eq('is_read', false)
  
  const { data, error } = await query
  
  if (error) throw error
  return data as Notification[]
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
  
  if (error) throw error
}

// Utility Functions
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.asin(Math.sqrt(a))
  return R * c
}
