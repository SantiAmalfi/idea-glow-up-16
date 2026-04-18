import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[MP-CREATE-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    log("User authenticated", { userId: user.id });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    // Create preapproval (subscription) directly without preapproval_plan
    // This is simpler and works for single-plan setups
    const preapprovalBody = {
      reason: "Project Evaluator - Plan Premium Anual",
      auto_recurring: {
        frequency: 12,
        frequency_type: "months",
        transaction_amount: 25000,
        currency_id: "ARS",
      },
      back_url: `${origin}/?mp=success`,
      payer_email: user.email,
      external_reference: user.id,
      notification_url: webhookUrl,
      status: "pending",
    };

    log("Creating preapproval", { email: user.email });

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      log("MP API error", { status: mpResponse.status, body: mpData });
      throw new Error(`Mercado Pago error [${mpResponse.status}]: ${JSON.stringify(mpData)}`);
    }

    log("Preapproval created", { preapprovalId: mpData.id, status: mpData.status });

    // Save initial pending record using service role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await adminClient.from("subscriptions").upsert(
      {
        user_id: user.id,
        preapproval_id: mpData.id,
        status: mpData.status ?? "pending",
        payer_email: user.email,
        amount: 25000,
        currency: "ARS",
      },
      { onConflict: "preapproval_id" }
    );

    return new Response(
      JSON.stringify({
        url: mpData.init_point,
        preapproval_id: mpData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
