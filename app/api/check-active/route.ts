import { NextResponse } from "next/server";
import { createClient as createSupabase } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Use service role client to bypass RLS for server-side checks
  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("transaction_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({ active: true });
}