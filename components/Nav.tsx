"use client";
import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/rebuild", label: "Rebuild" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative border-b border-line px-5 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-display text-[1.35rem] font-bold tracking-tight no-underline" onClick={() => setOpen(false)}>
          Astrape
        </Link>

        <div className="hidden gap-7 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[.95rem] font-medium no-underline hover:text-ink ${active === l.href ? "text-ink" : "text-mute"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] border-0 bg-transparent sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block h-[1.5px] w-5 bg-ink transition-transform ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
          <span className={`block h-[1.5px] w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block h-[1.5px] w-5 bg-ink transition-transform ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-full z-20 border-b border-line bg-bg px-5 py-2 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block border-t border-line py-3 text-[1.05rem] font-medium no-underline first:border-t-0 ${
                active === l.href ? "text-ink" : "text-mute"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
