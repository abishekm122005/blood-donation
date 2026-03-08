'use server'

import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BloodConnect@Admin2026'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing server configuration')
  }

  return createClient(url, serviceKey)
}

export async function verifyAdminPassword(password: string) {
  if (!password || password !== ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid admin password' }
  }
  return { success: true }
}

export async function createDonationCamp(
  adminPassword: string,
  campData: {
    name: string
    description?: string
    location: string
    latitude: number
    longitude: number
    start_date: string
    end_date: string
    organizer_name: string
    organizer_phone: string
    status?: 'upcoming' | 'ongoing' | 'completed'
  }
) {
  if (adminPassword !== ADMIN_PASSWORD) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('donation_camps')
      .insert([{ ...campData, status: campData.status || 'upcoming' }])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create camp'
    return { success: false, error: message }
  }
}

export async function updateDonationCamp(
  adminPassword: string,
  campId: string,
  updates: {
    name?: string
    description?: string
    location?: string
    latitude?: number
    longitude?: number
    start_date?: string
    end_date?: string
    organizer_name?: string
    organizer_phone?: string
    status?: 'upcoming' | 'ongoing' | 'completed'
  }
) {
  if (adminPassword !== ADMIN_PASSWORD) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('donation_camps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', campId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update camp'
    return { success: false, error: message }
  }
}

export async function deleteDonationCamp(adminPassword: string, campId: string) {
  if (adminPassword !== ADMIN_PASSWORD) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('donation_camps')
      .delete()
      .eq('id', campId)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete camp'
    return { success: false, error: message }
  }
}

export async function getAdminCamps(adminPassword: string) {
  if (adminPassword !== ADMIN_PASSWORD) {
    return { success: false, error: 'Unauthorized', data: [] }
  }

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('donation_camps')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return { success: true, data: data || [] }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch camps'
    return { success: false, error: message, data: [] }
  }
}
