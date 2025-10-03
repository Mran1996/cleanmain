import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {

  const { id, email, first_name, last_name } = await req.json()

  const { error } = await supabase
    .from('profiles')
    .insert([{ id, email, first_name, last_name }])

  if (error) {
    console.error('Profile insert failed:', error)
    return NextResponse.json({ error: error.message || 'Profile creation failed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 