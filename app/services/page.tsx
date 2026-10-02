import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Services — Astrape",
  description:
    "Custom design, lightning-fast loading, security, and visibility across search and AI assistants — what's included on every site Astrape builds.",
};

const VISIBILITY = [
  { h: "Search", p: "Clean structure and proper technical foundations, so search engines can read your site correctly and rank it fairly." },
  { h: "AI answers", p: "Content written and structured so that when someone asks Google's AI overview about you, it can describe you accurately." },
  { h: "AI assistants", p: "Content structured so tools like ChatGPT and Perplexity can find your business and cite it correctly when someone asks for a recommendation." },
];

const ROWS = [
  { h: "Custom design", p: "Every layout is drawn around your business and the people you're trying to reach — nothing pulled from a shared template library." },
  { h: "Lightning-fast loading", p: "Pages load in a flash. Nothing waits on scripts your visitor doesn't need." },
  { h: "Secure by default", p: "Encrypted connections and properly handled data as standard, not something bolted on afterward." },
  { h: "Reliable hosting", p: "Your site runs on infrastructure built for uptime and speed worldwide, not a shared server that slows down under load." },
  { h: "Room to grow", p: "Accounts, bookings, payments, dashboards — the foundation supports adding real functionality later without a rebuild." },
  { h: "Works everywhere", p: "Polished on a phone, a tablet, and a desktop alike — not a desktop site that's merely shrunk to fit." },
];

export default function Services() {
  return (
    <>
      <Nav />
      <main id="main-content">
      <section className="mx-auto max-w-[1080px] px-5 sm:px-8 py-[clamp(80px,13vw,140px)] pb-[clamp(48px,7vw,72px)]">
          <h1 className="mb-4 max-w-[17ch] font-display text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight">
            What&apos;s included, on every site we build
          </h1>
          <p className="max-w-[38rem] text-[1.12rem] text-mute">Not add-ons, not upsells — these are the standard for how we build.</p>
        </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,100px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-2 max-w-[24ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            Found by people, and by the AI they&apos;re asking
          </h2>
          <p className="mb-10 max-w-[56ch] text-mute">
            Search hasn&apos;t stayed in one place. People still type questions into Google, but more and more of them are asking an AI assistant directly, or reading the AI-generated summary at the top of the results. A site only built for the old kind of search misses the other two.
          </p>
          <ul className="m-0 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-3">
            {VISIBILITY.map((v) => (
              <li key={v.h}>
                <h3 className="mb-2 font-display text-lg font-semibold text-ink">{v.h}</h3>
                <p className="m-0 text-mute">{v.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line py-[clamp(56px,9vw,100px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-9 max-w-[22ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            The rest of what&apos;s built in
          </h2>
          <ul className="m-0 list-none p-0">
            {ROWS.map((r, i) => (
              <li key={r.h} className={`grid grid-cols-1 gap-2 border-line py-6 sm:grid-cols-[1fr_1.5fr] sm:gap-12 ${i ? "border-t" : ""}`}>
                <h3 className="m-0 font-display text-2xl font-semibold">{r.h}</h3>
                <p className="m-0 max-w-[46ch] text-mute">{r.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,100px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-4 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            Have a project in mind?
          </h2>
          <p className="mb-7 max-w-[32rem] text-mute">Tell us what you&apos;re building and we&apos;ll get back to you within one working day.</p>
          <Link href="/contact" className="inline-block rounded-md border border-ink bg-ink px-6 py-3 font-medium text-[#05070d] no-underline hover:border-acc hover:bg-acc">
            Contact us
          </Link>
        </div>
      </section>
      </main>
    </>
  );
}
