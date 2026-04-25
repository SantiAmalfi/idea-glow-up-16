import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `Rls-${runId}-Aa1!`;
const users: Array<{ id: string; email: string; client: SupabaseClient }> = [];
const checks: Array<{ name: string; passed: boolean; details?: string }> = [];

function record(name: string, passed: boolean, details?: string) {
  checks.push({ name, passed, details });
  console.log(`${passed ? "✓" : "✗"} ${name}${details ? ` — ${details}` : ""}`);
}

function failNow(message: string): never {
  throw new Error(message);
}

async function createTestUser(label: string) {
  const email = `rls-${label}-${runId}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS ${label}` },
  });
  if (error || !data.user) failNow(`Could not create ${label}: ${error?.message}`);

  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) failNow(`Could not sign in ${label}: ${signInError.message}`);

  const user = { id: data.user.id, email, client };
  users.push(user);
  return user;
}

async function expectNoRows<T>(name: string, query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const { data, error } = await query;
  const passed = !!error || !data || data.length === 0;
  record(name, passed, error ? `blocked with error: ${error.message}` : `returned ${data?.length ?? 0} rows`);
}

async function expectInsertDenied(name: string, query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { error } = await query;
  record(name, !!error, error ? `blocked with error: ${error.message}` : "insert was allowed");
}

async function seedData(userA: Awaited<ReturnType<typeof createTestUser>>, userB: Awaited<ReturnType<typeof createTestUser>>) {
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(now.getFullYear() + 1);

  const { error } = await admin.from("profiles").upsert([
    { user_id: userA.id, email: userA.email, display_name: "RLS User A" },
    { user_id: userB.id, email: userB.email, display_name: "RLS User B" },
  ], { onConflict: "user_id" });
  if (error) failNow(`Could not seed profiles: ${error.message}`);

  const { error: analysisError } = await admin.from("analysis_usage").insert([
    { user_id: userA.id, project_name: "own-analysis", input_data: { owner: "a" } },
    { user_id: userB.id, project_name: "foreign-analysis", input_data: { secret: "b" } },
  ]);
  if (analysisError) failNow(`Could not seed analysis_usage: ${analysisError.message}`);

  const { error: reportError } = await admin.from("report_settings").insert([
    { user_id: userA.id, template_id: "professional", header_title: "Own report" },
    { user_id: userB.id, template_id: "professional", header_title: "Foreign report" },
  ]);
  if (reportError) failNow(`Could not seed report_settings: ${reportError.message}`);

  const { error: subError } = await admin.from("subscriptions").insert([
    {
      user_id: userA.id,
      preapproval_id: `rls-a-${runId}`,
      status: "authorized",
      next_payment_date: nextYear.toISOString(),
      payer_email: userA.email,
    },
    {
      user_id: userB.id,
      preapproval_id: `rls-b-${runId}`,
      status: "authorized",
      next_payment_date: nextYear.toISOString(),
      payer_email: userB.email,
    },
  ]);
  if (subError) failNow(`Could not seed subscriptions: ${subError.message}`);

  const { error: roleError } = await admin.from("user_roles").insert([
    { user_id: userA.id, role: "user" },
    { user_id: userB.id, role: "moderator" },
  ]);
  if (roleError) failNow(`Could not seed user_roles: ${roleError.message}`);

  const ownLogo = new File(["own"], `${userA.id}.txt`, { type: "text/plain" });
  const foreignLogo = new File(["foreign"], `${userB.id}.txt`, { type: "text/plain" });
  await userA.client.storage.from("company-logos").upload(`${userA.id}/rls-${runId}.txt`, ownLogo, { upsert: true });
  await userB.client.storage.from("company-logos").upload(`${userB.id}/rls-${runId}.txt`, foreignLogo, { upsert: true });
}

async function run() {
  const userA = await createTestUser("a");
  const userB = await createTestUser("b");
  await seedData(userA, userB);

  await expectNoRows(
    "profiles: user A cannot read user B profile",
    userA.client.from("profiles").select("user_id,email,display_name").eq("user_id", userB.id)
  );
  await expectNoRows(
    "profiles: user A cannot update user B profile",
    userA.client.from("profiles").update({ display_name: "hacked" }).eq("user_id", userB.id).select("user_id")
  );
  await expectInsertDenied(
    "profiles: user A cannot insert a profile for user B",
    userA.client.from("profiles").insert({ user_id: userB.id, email: "takeover@example.test" }).select("id")
  );

  await expectNoRows(
    "analysis_usage: user A cannot read user B analyses",
    userA.client.from("analysis_usage").select("id,input_data").eq("user_id", userB.id)
  );
  await expectNoRows(
    "analysis_usage: user A cannot delete user B analyses",
    userA.client.from("analysis_usage").delete().eq("user_id", userB.id).select("id")
  );
  await expectInsertDenied(
    "analysis_usage: user A cannot create analyses for user B",
    userA.client.from("analysis_usage").insert({ user_id: userB.id, project_name: "spoofed" }).select("id")
  );

  await expectNoRows(
    "report_settings: user A cannot read user B settings",
    userA.client.from("report_settings").select("id,header_title,logo_url").eq("user_id", userB.id)
  );
  await expectNoRows(
    "report_settings: user A cannot update user B settings",
    userA.client.from("report_settings").update({ header_title: "hacked" }).eq("user_id", userB.id).select("id")
  );
  await expectInsertDenied(
    "report_settings: user A cannot create settings for user B",
    userA.client.from("report_settings").insert({ user_id: userB.id, template_id: "professional" }).select("id")
  );

  await expectNoRows(
    "subscriptions: user A cannot read user B subscription",
    userA.client.from("subscriptions").select("id,preapproval_id,payer_email").eq("user_id", userB.id)
  );
  await expectNoRows(
    "subscriptions: user A cannot update user B subscription",
    userA.client.from("subscriptions").update({ status: "cancelled" }).eq("user_id", userB.id).select("id")
  );
  await expectInsertDenied(
    "subscriptions: user A cannot create subscriptions directly",
    userA.client.from("subscriptions").insert({ user_id: userA.id, preapproval_id: `direct-${runId}` }).select("id")
  );

  await expectNoRows(
    "user_roles: user A cannot read user B roles",
    userA.client.from("user_roles").select("id,role").eq("user_id", userB.id)
  );
  await expectNoRows(
    "user_roles: user A cannot update user B roles",
    userA.client.from("user_roles").update({ role: "admin" }).eq("user_id", userB.id).select("id")
  );
  await expectInsertDenied(
    "user_roles: user A cannot grant roles",
    userA.client.from("user_roles").insert({ user_id: userA.id, role: "admin" }).select("id")
  );

  const { data: foreignCount, error: countError } = await userA.client.rpc("get_user_analysis_count", { p_user_id: userB.id });
  record("rpc: user A cannot see user B analysis count", !countError && foreignCount === 0, countError?.message ?? `returned ${foreignCount}`);

  const { data: foreignSubscription, error: subRpcError } = await userA.client.rpc("user_has_active_subscription", { p_user_id: userB.id });
  record("rpc: user A cannot see user B subscription status", !subRpcError && foreignSubscription === false, subRpcError?.message ?? `returned ${foreignSubscription}`);

  const { data: foreignDownload, error: foreignDownloadError } = await userA.client.storage
    .from("company-logos")
    .download(`${userB.id}/rls-${runId}.txt`);
  record(
    "storage: user A cannot download user B logo",
    !!foreignDownloadError || !foreignDownload,
    foreignDownloadError?.message ?? "download was allowed"
  );

  const spoofedLogo = new File(["spoofed"], "spoofed.txt", { type: "text/plain" });
  const { error: spoofUploadError } = await userA.client.storage
    .from("company-logos")
    .upload(`${userB.id}/spoofed-${runId}.txt`, spoofedLogo, { upsert: true });
  record(
    "storage: user A cannot upload into user B folder",
    !!spoofUploadError,
    spoofUploadError?.message ?? "upload was allowed"
  );

  const failed = checks.filter((check) => !check.passed);
  if (failed.length > 0) {
    throw new Error(`RLS verification failed: ${failed.map((check) => check.name).join(", ")}`);
  }

  console.log(`\nAll ${checks.length} RLS isolation checks passed.`);
}

async function cleanup() {
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return;

  await admin.storage.from("company-logos").remove([
    ...userIds.map((id) => `${id}/rls-${runId}.txt`),
    ...userIds.map((id) => `${id}/spoofed-${runId}.txt`),
  ]);
  await admin.from("analysis_usage").delete().in("user_id", userIds);
  await admin.from("report_settings").delete().in("user_id", userIds);
  await admin.from("subscriptions").delete().in("user_id", userIds);
  await admin.from("user_roles").delete().in("user_id", userIds);
  await admin.from("profiles").delete().in("user_id", userIds);

  for (const user of users) {
    await admin.auth.admin.deleteUser(user.id);
  }
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(cleanup);
