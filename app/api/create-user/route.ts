import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client conditionally
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export async function POST(req: Request) {
  const supabase = getSupabaseClient();
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