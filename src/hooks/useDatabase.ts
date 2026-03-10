'use client'

import { useAuth } from '@/components/AuthProvider'
import { Profile, BloodRequest, DonationCamp, Notification } from '@/types/database'
import { useState, useCallback } from 'react'

export function useDatabase() {
  const { supabase } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return null
    }

    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (err) throw err
      return data as Profile
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching profile:', err)
      return null
    }
  }, [supabase])

  const updateProfile = useCallback(async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return null
    }

    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (err) throw err
      return data as Profile
    } catch (err: any) {
      setError(err.message)
      console.error('Error updating profile:', err)
      return null
    }
  }, [supabase])

  const searchDonors = useCallback(async (
    bloodGroup: string,
    location: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Profile[]> => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return []
    }

    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('blood_group', bloodGroup)
        .eq('is_available', true)
        .eq('is_donor', true)

      if (err) throw err

      // Filter by distance
      const donors = (data as Profile[]).filter(donor => {
        const distance = calculateDistance(latitude, longitude, donor.latitude || 0, donor.longitude || 0)
        return distance <= radiusKm
      })

      return donors
    } catch (err: any) {
      setError(err.message)
      console.error('Error searching donors:', err)
      return []
    }
  }, [supabase])

  const getDonorsByCity = useCallback(async (
    city: string,
    bloodGroups?: string[]
  ): Promise<Profile[]> => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return []
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_available', true)
        .eq('is_donor', true)
        .ilike('location', `%${city}%`)

      if (bloodGroups && bloodGroups.length > 0) {
        query = query.in('blood_group', bloodGroups)
      }

      const { data, error: err } = await query

      if (err) throw err

      return (data as Profile[]) || []
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching donors by city:', err)
      return []
    }
  }, [supabase])

  return {
    getProfile,
    updateProfile,
    searchDonors,
    getDonorsByCity,
    error,
  }
}

// Utility function
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
