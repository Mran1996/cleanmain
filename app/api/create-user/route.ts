import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy-initialize Supabase client to avoid build-time errors
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, key)
}

export async function POST(req: Request) {
  const { id, email, first_name, last_name } = await req.json()

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .insert([{ id, email, first_name, last_name }])

  if (error) {
    console.error('Profile insert failed:', error)
    return NextResponse.json({ error: error.message || 'Profile creation failed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 