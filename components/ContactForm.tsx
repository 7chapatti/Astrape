"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const MAX = { name: 100, business: 150, email: 254, site: 300, message: 5000 } as const;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const resetTurnstile = () => (window as unknown as { turnstile?: { reset(): void } }).turnstile?.reset();

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "done") doneHeadingRef.current?.focus();
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const fd = new FormData(e.currentTarget);
    const text = (key: string) => String(fd.get(key) ?? "").trim();

    const turnstile = text("cf-turnstile-response");
    if (TURNSTILE_SITE_KEY && !turnstile) {
      setError("Please wait a moment for the verification to finish, then press Send again.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: text("name"),
          business: text("business"),
          email: text("email"),
          site: text("site"),
          message: text("msg"),
          contact_extra: text("contact_extra"),
          turnstile,
        }),
      });
      if (res.ok) {
        setStatus("done");
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Something went wrong sending that — mind trying again in a moment?");
      setStatus("error");
      resetTurnstile();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
      setStatus("error");
      resetTurnstile();
    }
  }

  if (status === "done") {
    return (
      <section aria-labelledby="contact-done" className="py-10">
        <h2 id="contact-done" ref={doneHeadingRef} tabIndex={-1} className="mb-2 font-display text-3xl font-bold outline-none">
          Got it.
        </h2>
        <p className="m-0 text-mute">Thanks — we&apos;ll get back to you within one working day.</p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 pb-[clamp(64px,10vw,110px)]">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Name" id="name" name="name" autoComplete="name" maxLength={MAX.name} required />
        <Field label="Business name" id="business" name="business" autoComplete="organization" maxLength={MAX.business} optional />
      </div>
      <Field label="Email" id="email" name="email" type="email" autoComplete="email" maxLength={MAX.email} required />
      <Field label="Current website" id="site" name="site" type="url" autoComplete="url" maxLength={MAX.site} placeholder="https://" optional />
      <div className="grid gap-2">
        <label htmlFor="msg" className="text-[.92rem] text-mute">Tell us a bit more</label>
        <textarea
          id="msg"
          name="msg"
          required
          maxLength={MAX.message}
          placeholder="What's the site for, and what should it do for you?"
          className="min-h-[120px] w-full resize-y rounded-md border border-mute/40 bg-[#0a0f1c] px-4 py-3 text-ink focus:border-acc focus:outline-none"
        />
      </div>

      {/* Honeypot. Hidden from sight, keyboard and assistive tech. */}
      <input
        type="text"
        name="contact_extra"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {TURNSTILE_SITE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          {/* Needed as the mount point Turnstile fills in. Only visible if a visitor is actually challenged. */}
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark" data-appearance="interaction-only" />
        </>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="justify-self-start rounded-md border border-ink bg-ink px-7 py-3 font-medium text-[#05070d] hover:border-acc hover:bg-acc disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "error" && (
        <p role="alert" className="m-0 text-sm text-mute">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  id,
  name,
  type = "text",
  required,
  optional,
  placeholder,
  autoComplete,
  maxLength,
}: {
  label: string;
  id: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[.92rem] text-mute">
        {optional ? `${label} (optional)` : label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className="w-full rounded-md border border-mute/40 bg-[#0a0f1c] px-4 py-3 text-ink focus:border-acc focus:outline-none"
      />
    </div>
  );
}
