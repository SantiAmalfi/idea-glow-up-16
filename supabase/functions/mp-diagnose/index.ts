// TEMPORARY diagnostic function — validates MP token & preapproval API
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const result: Record<string, unknown> = {
    token_present: !!mpToken,
    token_prefix: mpToken ? mpToken.substring(0, 8) : null,
    token_length: mpToken?.length ?? 0,
    is_test_token: mpToken?.startsWith("TEST-") ?? false,
  };

  if (!mpToken) {
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // 1. Validate token with /users/me
  try {
    const meRes = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    const meBody = await meRes.json();
    result.users_me_status = meRes.status;
    result.users_me_ok = meRes.ok;
    result.account_email = meBody.email;
    result.account_country = meBody.site_id;
    result.account_id = meBody.id;
  } catch (e) {
    result.users_me_error = String(e);
  }

  // 2. Try creating a test preapproval (without card, returns init_point)
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;
    const testBody = {
      reason: "DIAGNOSTIC TEST",
      auto_recurring: {
        frequency: 12,
        frequency_type: "months",
        transaction_amount: 25000,
        currency_id: "ARS",
      },
      back_url: "https://example.com/?mp=success",
      payer_email: "test_user_123@testuser.com",
      external_reference: "diagnostic-test",
      notification_url: webhookUrl,
    };
    const ppRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testBody),
    });
    const ppBody = await ppRes.json();
    result.preapproval_status = ppRes.status;
    result.preapproval_ok = ppRes.ok;
    result.preapproval_response = ppBody;
  } catch (e) {
    result.preapproval_error = String(e);
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
