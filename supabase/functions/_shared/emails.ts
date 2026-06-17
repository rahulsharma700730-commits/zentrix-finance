// Shared email helpers for Zentrix Finance
// Sends branded transactional emails via Resend.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Zentrix Finance <noreply@zentrixfinance.com>";
const REPLY_TO = "support@zentrixfinance.com";
const SITE_URL = "https://zentrixfinance.com";
const LOGO_URL = `${SITE_URL}/logo.png`;

const GOLD = "#FFD700";
const BG = "#0A0A0A";
const CARD = "#141414";
const TEXT = "#EDEDED";
const MUTED = "#9A9A9A";

function shell(title: string, preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT};">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD};border:1px solid #1f1f1f;border-radius:14px;overflow:hidden;">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #1f1f1f;text-align:center;">
        <div style="font-size:22px;font-weight:700;letter-spacing:2px;color:${GOLD};">ZENTRIX <span style="color:${TEXT};">FINANCE</span></div>
        <div style="font-size:11px;color:${MUTED};letter-spacing:3px;margin-top:4px;">WEALTH MANAGEMENT</div>
      </td></tr>
      <tr><td style="padding:32px;">${inner}</td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #1f1f1f;text-align:center;color:${MUTED};font-size:12px;line-height:1.6;">
        Need help? Reply to this email or contact <a href="mailto:${REPLY_TO}" style="color:${GOLD};text-decoration:none;">${REPLY_TO}</a><br/>
        © ${new Date().getFullYear()} Zentrix Finance · <a href="${SITE_URL}" style="color:${MUTED};text-decoration:underline;">zentrixfinance.com</a><br/>
        <span style="color:#6a6a6a;">You received this email because this address was used on Zentrix Finance.</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export function otpEmail(code: string, purpose: "signup" | "password_reset") {
  const heading = purpose === "signup" ? "Confirm your email" : "Reset your password";
  const intro = purpose === "signup"
    ? "Use the code below to finish creating your Zentrix Finance account."
    : "Use the code below to reset your Zentrix Finance password.";
  const subject = purpose === "signup"
    ? `${code} is your Zentrix Finance verification code`
    : `${code} is your Zentrix Finance password reset code`;

  const inner = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${TEXT};">${heading}</h1>
    <p style="margin:0 0 24px;color:${MUTED};font-size:14px;line-height:1.6;">${intro}</p>
    <div style="background:${BG};border:1px solid #2a2a2a;border-radius:10px;padding:22px;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;color:${MUTED};letter-spacing:2px;margin-bottom:8px;">YOUR CODE</div>
      <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:${GOLD};font-family:'Courier New',monospace;">${code}</div>
    </div>
    <p style="margin:0 0 8px;color:${MUTED};font-size:13px;line-height:1.6;">This code expires in <strong style="color:${TEXT};">10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
    <p style="margin:16px 0 0;color:${MUTED};font-size:12px;">For your security, never share this code with anyone — Zentrix Finance staff will never ask for it.</p>
  `;
  return { subject, html: shell(heading, `${heading} · code ${code}`, inner) };
}

export function welcomeEmail(opts: {
  fullName: string;
  email: string;
  referralCode: string;
}) {
  const refLink = `${SITE_URL}/auth?tab=signup&ref=${encodeURIComponent(opts.referralCode)}`;
  const subject = `Welcome to Zentrix Finance, ${opts.fullName.split(" ")[0] || "Investor"}`;
  const inner = `
    <h1 style="margin:0 0 12px;font-size:24px;color:${TEXT};">Welcome aboard, ${opts.fullName} 👋</h1>
    <p style="margin:0 0 22px;color:${MUTED};font-size:14px;line-height:1.6;">
      Your Zentrix Finance account is ready. Below are your details and a short guide to get you started.
    </p>

    <div style="background:${BG};border:1px solid #2a2a2a;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="color:${MUTED};font-size:12px;letter-spacing:1.5px;margin-bottom:10px;">ACCOUNT DETAILS</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:${TEXT};">
        <tr><td style="padding:4px 0;color:${MUTED};width:140px;">Full name</td><td style="padding:4px 0;">${opts.fullName}</td></tr>
        <tr><td style="padding:4px 0;color:${MUTED};">Email</td><td style="padding:4px 0;">${opts.email}</td></tr>
        <tr><td style="padding:4px 0;color:${MUTED};">Referral code</td><td style="padding:4px 0;color:${GOLD};font-weight:600;">${opts.referralCode}</td></tr>
        <tr><td style="padding:4px 0;color:${MUTED};">Referral link</td><td style="padding:4px 0;"><a href="${refLink}" style="color:${GOLD};text-decoration:none;word-break:break-all;">${refLink}</a></td></tr>
      </table>
    </div>

    <div style="background:${BG};border:1px solid #2a2a2a;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="color:${MUTED};font-size:12px;letter-spacing:1.5px;margin-bottom:10px;">GETTING STARTED</div>
      <ol style="margin:0;padding-left:20px;color:${TEXT};font-size:14px;line-height:1.8;">
        <li>Log in to your dashboard at <a href="${SITE_URL}" style="color:${GOLD};text-decoration:none;">zentrixfinance.com</a>.</li>
        <li>Deposit using <strong style="color:${GOLD};">USDT on BEP20 (BSC)</strong> only — in multiples of <strong>$50</strong>.</li>
        <li>Choose an investment plan and confirm your deposit hash for activation.</li>
        <li>Track your daily ROI, team and rewards from the dashboard.</li>
      </ol>
    </div>

    <div style="background:${BG};border:1px solid #2a2a2a;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
      <div style="color:${MUTED};font-size:12px;letter-spacing:1.5px;margin-bottom:10px;">EARNINGS OVERVIEW</div>
      <p style="margin:0 0 8px;color:${TEXT};font-size:14px;line-height:1.6;">
        <strong style="color:${GOLD};">Daily ROI</strong> over a 20-month cycle, capped at 200% of your investment.
        Formula: <span style="color:${MUTED};">(Investment × 2) ÷ 600</span> credited daily.
      </p>
      <p style="margin:0;color:${TEXT};font-size:14px;line-height:1.6;">
        <strong style="color:${GOLD};">5-level referral commissions</strong> are paid <em>daily</em> on your downline's ROI:
        <span style="color:${MUTED};">10% / 3% / 3% / 2% / 2%</span>. Climb ranks from Bronze to Crown as your team grows.
        Minimum withdrawal: <strong>$20</strong>.
      </p>
    </div>

    <div style="text-align:center;margin:8px 0 4px;">
      <a href="${SITE_URL}/dashboard" style="display:inline-block;background:${GOLD};color:${BG};text-decoration:none;font-weight:700;padding:14px 28px;border-radius:8px;font-size:15px;letter-spacing:0.5px;">Open my dashboard</a>
    </div>
  `;
  return { subject, html: shell("Welcome to Zentrix Finance", "Your account is ready — get started in minutes.", inner) };
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return await res.json();
}
