import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmail, welcomeEmail } from "../_shared/emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email, code, password, fullName, referralCode } = await req.json();
    if (!email || !code || !password || !fullName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof password !== "string" || password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!/^\d{6}$/.test(String(code))) {
      return new Response(JSON.stringify({ error: "Invalid code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normEmail = String(email).trim().toLowerCase();

    // Find latest unverified OTP for this email/purpose.
    const { data: otp, error: otpErr } = await admin
      .from("email_otps")
      .select("*")
      .eq("email", normEmail).eq("purpose", "signup").eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
    if (otpErr) throw otpErr;
    if (!otp) return new Response(JSON.stringify({ error: "No verification code found. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (otp.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const codeHash = await sha256Hex(String(code));
    if (codeHash !== otp.code_hash) {
      await admin.from("email_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve referral code.
    let referredBy: string | null = null;
    if (referralCode && String(referralCode).trim()) {
      const { data: refUserId } = await admin.rpc("get_user_id_by_referral_code", { _code: String(referralCode).trim() });
      if (!refUserId) {
        return new Response(JSON.stringify({ error: "Invalid referral code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      referredBy = refUserId as string;
    }

    // Create user (email pre-confirmed).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: normEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: String(fullName), referred_by: referredBy },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message || "Failed to create account";
      const status = /already|registered|exists/i.test(msg) ? 409 : 400;
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("email_otps").update({ verified: true }).eq("id", otp.id);

    // Fetch generated referral code from profile (created by trigger).
    let userReferralCode = "";
    for (let i = 0; i < 5; i++) {
      const { data: prof } = await admin.from("profiles").select("referral_code").eq("user_id", created.user.id).maybeSingle();
      if (prof?.referral_code) { userReferralCode = prof.referral_code; break; }
      await new Promise((r) => setTimeout(r, 200));
    }

    // Welcome email (best-effort).
    try {
      const { subject, html } = welcomeEmail({ fullName: String(fullName), email: normEmail, referralCode: userReferralCode });
      await sendEmail(normEmail, subject, html);
    } catch (e) {
      console.error("welcome email failed", e);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-signup error", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Verification failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
