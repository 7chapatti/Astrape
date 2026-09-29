"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/rebuild", label: "Rebuild" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Close after navigating.
  useEffect(() => setOpen(false), [pathname]);

  // Close if the window grows past the mobile breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // While open: lock scroll without shifting layout, Escape closes, focus moves in.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    menuRef.current?.querySelector("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open]);

  return (
    <header>
      <nav
        aria-label="Main"
        className="relative flex min-h-[4.75rem] items-center justify-between border-b border-line px-5 py-3 sm:px-8 max-md:z-[1000]"
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="relative z-10 font-display text-[1.35rem] font-bold leading-none tracking-tight no-underline"
        >
          Astrape
        </Link>

        <ul
          id="primary-menu"
          ref={menuRef}
          {...(open ? {} : { inert: true })}
          className={`m-0 flex list-none items-center p-0 md:gap-7
            max-md:fixed max-md:inset-0 max-md:z-0 max-md:flex-col max-md:justify-center max-md:gap-8 max-md:bg-bg
            max-md:transition-[opacity,visibility] max-md:duration-300 max-md:ease-out motion-reduce:max-md:transition-none
            ${open ? "max-md:visible max-md:opacity-100" : "max-md:invisible max-md:opacity-0"}`}
        >
          {LINKS.map((l, i) => (
            <li
              key={l.href}
              style={{ transitionDelay: open ? `${100 + i * 50}ms` : "0ms" }}
              className={`max-md:transition-[opacity,transform] max-md:duration-300 max-md:ease-out motion-reduce:max-md:transition-none ${
                open ? "max-md:translate-y-0 max-md:opacity-100" : "max-md:translate-y-3 max-md:opacity-0"
              }`}
            >
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`text-[.95rem] font-medium no-underline hover:text-ink max-md:text-[1.25rem] ${
                  pathname === l.href ? "text-ink" : "text-mute"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="primary-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="relative z-10 -mr-2.5 flex h-11 w-11 items-center justify-center text-mute hover:text-ink md:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <line
              x1="4" y1="6" x2="20" y2="6"
              className={`origin-center [transform-box:fill-box] transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "translate-y-[6px] rotate-45" : ""}`}
            />
            <line
              x1="4" y1="12" x2="20" y2="12"
              className={`origin-center [transform-box:fill-box] transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${open ? "scale-x-0 opacity-0" : ""}`}
            />
            <line
              x1="4" y1="18" x2="20" y2="18"
              className={`origin-center [transform-box:fill-box] transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
            />
          </svg>
        </button>
      </nav>
    </header>
  );
}
