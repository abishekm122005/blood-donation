'use server'

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing server configuration')
  }

  return createClient(url, serviceKey)
}

export async function createUserProfile(profileData: {
  id: string
  email: string
  full_name: string
  age: number
  blood_group: string
  phone: string
  location: string
  is_donor: boolean
}) {
  try {
    const supabaseAdmin = getAdminClient()

    // Check if profile already exists (handles re-registration / OAuth)
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', profileData.id)
      .single()

    if (existing) {
      // Update existing profile instead of failing
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          age: profileData.age,
          blood_group: profileData.blood_group,
          phone: profileData.phone,
          location: profileData.location,
          is_donor: profileData.is_donor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileData.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return { success: true, data }
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Profile creation failed'
    return { success: false, error: message }
  }
}

export async function resetPassword(email: string) {
  try {
    const supabaseAdmin = getAdminClient()

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/login`,
    })

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Password reset failed'
    return { success: false, error: message }
  }
}
