// Pure helpers for the contact form: validation and the notification email.
// No network and no environment access in here, so it is easy to test.

export const MAX = { name: 100, business: 150, email: 254, site: 300, message: 5000 } as const;

export interface Enquiry {
  name: string;
  business: string | null;
  email: string;
  site: string | null;
  message: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Strips control characters (including CR/LF, so nothing can smuggle a header or break a subject line).
const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

export function validateEnquiry(input: unknown): { ok: true; value: Enquiry } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Invalid request." };
  const o = input as Record<string, unknown>;

  const name = clean(o.name, MAX.name).replace(/[\r\n]+/g, " ");
  const business = clean(o.business, MAX.business).replace(/[\r\n]+/g, " ");
  const email = clean(o.email, MAX.email).replace(/[\r\n]+/g, "");
  const site = clean(o.site, MAX.site).replace(/[\r\n]+/g, "");
  const message = clean(o.message, MAX.message);

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!message) return { ok: false, error: "Please tell us a little about your project." };

  if (site) {
    try {
      const u = new URL(site);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("protocol");
    } catch {
      return { ok: false, error: "Please enter your website as a full address, like https://example.com." };
    }
  }

  return { ok: true, value: { name, business: business || null, email, site: site || null, message } };
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function buildEmail(e: Enquiry, receivedAt: Date) {
  const subject = `New enquiry from ${e.name}${e.business ? ` (${e.business})` : ""}`;
  const when = receivedAt.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/London" });

  const row = (label: string, valueHtml: string) =>
    `<p style="margin:0 0 14px"><strong style="display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#6b7280">${label}</strong>${valueHtml}</p>`;

  const siteHtml = e.site
    ? `<a href="${escapeHtml(e.site)}" style="color:#2563eb">${escapeHtml(e.site)}</a>`
    : `<em style="color:#9ca3af">Not provided</em>`;

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111827">
<main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:28px">
<h1 style="margin:0 0 4px;font-size:20px">New website enquiry</h1>
<p style="margin:0 0 22px;font-size:13px;color:#6b7280">Received <time datetime="${receivedAt.toISOString()}">${escapeHtml(when)}</time></p>
${row("Name", escapeHtml(e.name))}
${row("Business", e.business ? escapeHtml(e.business) : `<em style="color:#9ca3af">Not provided</em>`)}
${row("Email", `<a href="mailto:${escapeHtml(e.email)}" style="color:#2563eb">${escapeHtml(e.email)}</a>`)}
${row("Current website", siteHtml)}
${row("Message", `<span style="display:block;white-space:pre-wrap">${escapeHtml(e.message)}</span>`)}
<p style="margin:22px 0 0;font-size:13px;color:#6b7280">Hit reply to answer ${escapeHtml(e.name)} directly.</p>
</main>
</body>
</html>`;

  const text = [
    "New website enquiry",
    `Received: ${when}`,
    "",
    `Name: ${e.name}`,
    `Business: ${e.business ?? "-"}`,
    `Email: ${e.email}`,
    `Current website: ${e.site ?? "-"}`,
    "",
    "Message:",
    e.message,
  ].join("\n");

  return { subject, html, text };
}