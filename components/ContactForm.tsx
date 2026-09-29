"use client";
import { useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      business: (fd.get("business") as string) || null,
      email: fd.get("email") as string,
      site: (fd.get("site") as string) || null,
      message: fd.get("msg") as string,
    };
    const { error } = await supabase.from("contact_submissions").insert(payload);
    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <div className="py-10">
        <h2 className="mb-2 font-display text-3xl font-bold">Got it.</h2>
        <p className="m-0 text-mute">Thanks — we&apos;ll get back to you within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 pb-[clamp(64px,10vw,110px)]">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Name" id="name" name="name" required />
        <Field label="Business name" id="business" name="business" optional />
      </div>
      <Field label="Email" id="email" name="email" type="email" required />
      <Field label="Current website" id="site" name="site" type="url" placeholder="https://" optional />
      <div className="grid gap-2">
        <label htmlFor="msg" className="text-[.92rem] text-mute">Tell us a bit more</label>
        <textarea
          id="msg"
          name="msg"
          required
          placeholder="What's the site for, and what should it do for you?"
          className="min-h-[120px] w-full resize-y rounded-md border border-line bg-[#0a0f1c] px-4 py-3 text-ink focus:border-acc focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="justify-self-start rounded-md border border-ink bg-ink px-7 py-3 font-medium text-[#05070d] hover:border-acc hover:bg-acc disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "error" && (
        <p className="m-0 text-sm text-mute">
          {supabaseConfigured
            ? "Something went wrong sending that — mind trying again in a moment?"
            : "This form isn't connected yet — add your Supabase keys to .env.local (see the README)."}
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
}: {
  label: string;
  id: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[.92rem] text-mute">
        {label} {optional && <span className="text-[#5f6a86]">(optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-[#0a0f1c] px-4 py-3 text-ink focus:border-acc focus:outline-none"
      />
    </div>
  );
}
