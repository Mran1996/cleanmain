import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
}) : null;

const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    const { data: billing, error } = await supabase
      .from("payments")
      .select("stripe_receipt_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !billing?.stripe_receipt_url) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({ url: billing.stripe_receipt_url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 