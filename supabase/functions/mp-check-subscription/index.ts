import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[MP-CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    log("User authenticated", { userId: user.id });

    // Get latest subscription record
    const { data: sub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Skip MP sync for admin-granted subscriptions
    const isAdminGrant = sub.preapproval_id?.startsWith("admin-grant-");

    // Refresh status from MP (skip for admin grants)
    const mpRes = isAdminGrant
      ? null
      : await fetch(`https://api.mercadopago.com/preapproval/${sub.preapproval_id}`, {
          headers: { Authorization: `Bearer ${mpToken}` },
        });

    if (mpRes && mpRes.ok) {
      const mpSub = await mpRes.json();
      const nextDate = mpSub.next_payment_date ?? null;

      if (mpSub.status !== sub.status || nextDate !== sub.next_payment_date) {
        await supabaseClient
          .from("subscriptions")
          .update({
            status: mpSub.status,
            next_payment_date: nextDate,
          })
          .eq("preapproval_id", sub.preapproval_id);
        sub.status = mpSub.status;
        sub.next_payment_date = nextDate;
      }
      log("MP status synced", { status: mpSub.status });
    } else if (!isAdminGrant) {
      log("MP fetch failed, using DB state", { status: mpRes?.status });
    }

    const isActive =
      sub.status === "authorized" &&
      (!sub.next_payment_date || new Date(sub.next_payment_date) > new Date());

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        status: sub.status,
        subscription_end: sub.next_payment_date,
        preapproval_id: sub.preapproval_id,
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
