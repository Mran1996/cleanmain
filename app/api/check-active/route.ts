import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
    // Get authenticated user from Supabase
    const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({ active: true });
} 