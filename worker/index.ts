import { buildEmail, validateEnquiry } from "../lib/contact";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const MAX_BODY_BYTES = 20_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
  return false;
}

const json = (body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra },
  });

async function verifyTurnstile(secret: string, token: string, ip: string) {
  const form = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Turnstile ${res.status}`);
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, { Allow: "POST" });

  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: "Forbidden." }, 403);
  } catch {
    return json({ ok: false, error: "Forbidden." }, 403);
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (rateLimited(ip, Date.now())) {
    return json({ ok: false, error: "Too many messages from your connection. Please try again in a few minutes." }, 429);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "Message too large." }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  if (body.contact_extra) return json({ ok: true });

  const parsed = validateEnquiry(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  const to = (env.CONTACT_TO_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!env.RESEND_API_KEY || to.length === 0) {
    console.error("[contact] RESEND_API_KEY / CONTACT_TO_EMAIL are not set on this Worker.");
    return json({ ok: false, error: "This form isn't set up yet." }, 503);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof body.turnstile === "string" ? body.turnstile : "";
    if (!token) return json({ ok: false, error: "Please wait for the verification to finish, then try again." }, 400);
    try {
      if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip))) {
        return json({ ok: false, error: "Verification failed. Please refresh the page and try again." }, 400);
      }
    } catch (err) {
      console.error("[contact] Turnstile check failed:", err);
      return json({ ok: false, error: "Couldn't verify you just now. Please try again in a moment." }, 502);
    }
  }

  const { subject, html, text } = buildEmail(parsed.value, new Date());
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || "Astrape <onboarding@resend.dev>",
        to,
        reply_to: parsed.value.email,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  } catch (err) {
    console.error("[contact] Sending email failed:", err);
    return json({ ok: false, error: "Something went wrong sending that. Please try again in a moment." }, 502);
  }
  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleContact(request, env);
    if (pathname.startsWith("/api/")) return json({ ok: false, error: "Not found." }, 404);
    return env.ASSETS.fetch(request);
  },
};