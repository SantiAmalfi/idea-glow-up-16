import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  console.log(`[MP-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    const url = new URL(req.url);
    const queryType = url.searchParams.get("type") || url.searchParams.get("topic");
    const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Some MP notifications use only query params
    }

    const type = body.type || body.topic || queryType;
    const resourceId = body.data?.id || body.id || queryId;

    log("Received notification", { type, resourceId });

    if (!type || !resourceId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle preapproval (subscription) events
    if (type === "preapproval" || type === "subscription_preapproval") {
      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });

      if (!mpRes.ok) {
        log("Failed to fetch preapproval", { status: mpRes.status });
        return new Response(JSON.stringify({ ok: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const preapproval = await mpRes.json();
      log("Fetched preapproval", { id: preapproval.id, status: preapproval.status });

      const userId = preapproval.external_reference;
      if (!userId) {
        log("No external_reference (user_id) in preapproval");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      await adminClient.from("subscriptions").upsert(
        {
          user_id: userId,
          preapproval_id: preapproval.id,
          status: preapproval.status,
          payer_email: preapproval.payer_email,
          amount: preapproval.auto_recurring?.transaction_amount ?? 25000,
          currency: preapproval.auto_recurring?.currency_id ?? "ARS",
          next_payment_date: preapproval.next_payment_date ?? null,
          cancelled_at: preapproval.status === "cancelled" ? new Date().toISOString() : null,
        },
        { onConflict: "preapproval_id" }
      );

      log("Subscription updated in DB", { userId, status: preapproval.status });
    }

    // Handle authorized_payment (recurring payment success)
    if (type === "authorized_payment" || type === "subscription_authorized_payment") {
      const mpRes = await fetch(
        `https://api.mercadopago.com/authorized_payments/${resourceId}`,
        { headers: { Authorization: `Bearer ${mpToken}` } }
      );
      if (mpRes.ok) {
        const payment = await mpRes.json();
        const preapprovalId = payment.preapproval_id;
        if (preapprovalId && payment.status === "approved") {
          await adminClient
            .from("subscriptions")
            .update({ last_payment_date: new Date().toISOString() })
            .eq("preapproval_id", preapprovalId);
          log("Recurring payment recorded", { preapprovalId });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    // Return 200 so MP doesn't retry endlessly on our bugs
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
