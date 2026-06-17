import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { otpEmail, sendEmail } from "../_shared/emails.ts";

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

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

async function userExists(email: string): Promise<boolean> {
  // Use profiles as proxy; auth.admin doesn't expose a direct getByEmail.
  const { data } = await admin.from("profiles").select("user_id").eq("email", email).maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email, purpose } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (purpose !== "signup" && purpose !== "password_reset") {
      return new Response(JSON.stringify({ error: "Invalid purpose" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normEmail = email.trim().toLowerCase();

    const exists = await userExists(normEmail);
    if (purpose === "signup" && exists) {
      return new Response(JSON.stringify({ error: "An account with this email already exists. Please log in." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (purpose === "password_reset" && !exists) {
      // Don't leak; pretend success.
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit: max 3 codes per email/purpose per 10 minutes.
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await admin.from("email_otps")
      .select("id", { count: "exact", head: true })
      .eq("email", normEmail).eq("purpose", purpose).gte("created_at", since);
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = generateCode();
    const codeHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

    const { error: insErr } = await admin.from("email_otps").insert({
      email: normEmail, code_hash: codeHash, purpose, expires_at: expiresAt,
    });
    if (insErr) throw insErr;

    const { subject, html } = otpEmail(code, purpose);
    await sendEmail(normEmail, subject, html);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-otp error", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Failed to send code" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
