// Database Types
export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-'

export interface Profile {
  id: string
  email: string
  full_name: string
  age: number
  blood_group: BloodGroup
  phone: string
  location: string
  latitude: number
  longitude: number
  is_donor: boolean
  is_available: boolean
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface DonationHistory {
  id: string
  donor_id: string
  donation_date: string
  location: string
  blood_bank_id?: string
  units_donated: number
  notes?: string
  created_at: string
}

export interface BloodBank {
  id: string
  name: string
  address: string
  phone: string
  latitude: number
  longitude: number
  city: string
  available_blood_types: string
  operating_hours: string
  email?: string
  created_at: string
  updated_at: string
}

export interface BloodInventory {
  id: string
  blood_bank_id: string
  blood_group: BloodGroup
  units_available: number
  updated_at: string
}

export interface BloodRequest {
  id: string
  requester_id: string
  blood_group: BloodGroup
  units_needed: number
  hospital_name: string
  location: string
  latitude: number
  longitude: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  status: 'open' | 'fulfilled' | 'closed'
  created_at: string
  updated_at: string
}

export interface DonationCamp {
  id: string
  name: string
  description?: string
  location: string
  latitude: number
  longitude: number
  start_date: string
  end_date: string
  organizer_name: string
  organizer_phone: string
  status: 'upcoming' | 'ongoing' | 'completed'
  created_at: string
  updated_at: string
}

export interface CampRegistration {
  id: string
  donor_id: string
  camp_id: string
  registered_at: string
  status: 'registered' | 'attended' | 'cancelled'
}

export interface Notification {
  id: string
  user_id: string
  type: 'emergency' | 'camp' | 'reminder' | 'request'
  title: string
  message?: string
  blood_request_id?: string
  camp_id?: string
  is_read: boolean
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  blood_request_id?: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  donor_id: string
  requester_id: string
  rating: number
  comment?: string
  created_at: string
}
