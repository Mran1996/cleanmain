import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe-server";

const supabase = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Stripe or Supabase not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    // Find most recent paid transaction for this user
    const { data: tx, error } = await supabase
      .from("transactions")
      .select("stripe_payment_intent_id, stripe_invoice_id, metadata")
      .eq("user_id", userId)
      .eq("status", "paid")
      .order("transaction_date", { ascending: false })
      .limit(1)
      .single();

    if (error || !tx) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    let receiptUrl: string | undefined;
    // Prefer payment intent charge receipt
    if (tx.stripe_payment_intent_id) {
      const pi = await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id, {
        expand: ["latest_charge"]
      });
      const latestCharge = pi.latest_charge as any;
      receiptUrl = latestCharge?.receipt_url || undefined;
    }

    // Fallback to invoice hosted URL if available
    if (!receiptUrl && tx.stripe_invoice_id) {
      try {
        const inv = await stripe.invoices.retrieve(tx.stripe_invoice_id);
        receiptUrl = inv.hosted_invoice_url || inv.invoice_pdf || undefined;
      } catch {}
    }

    if (!receiptUrl) {
      return NextResponse.json({ error: "Receipt not available" }, { status: 404 });
    }

    return NextResponse.json({ url: receiptUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}