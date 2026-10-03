import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Rebuild your website - Astrape",
  description:
    "Already have a site built with a template or an AI tool? See why it might be costing you visitors, and what a proper rebuild changes.",
};

const STATS = [
  { b: "75%", p: "of people judge a company's credibility mainly by how its website looks, according to Stanford's web credibility research." },
  { b: "50ms", p: "is roughly how long it takes someone to form that first impression - long before they've read any of your content." },
  { b: "72%", p: "of consumers in a 2026 Pantheon survey mistook a legitimate site for an AI scam simply because it felt slow or glitchy." },
  { b: "53%", p: "of visitors on mobile will leave a page outright if it hasn't loaded within three seconds." },
];

const ROWS = [
  { h: "Design first, always", p: "We design your site around your business before anything gets built. Nothing gets pulled from a shared component library, so it can't end up looking like someone else's." },
  { h: "Nothing you don't need", p: "Every page ships only what it needs to render, so it appears the moment you tap - no waiting on scripts your visitor will never use." },
  { h: "Secure by default", p: "Encrypted connections, no bundled third-party trackers, and no leftover plugins from a builder you didn't choose - just the site you actually asked for." },
  { h: "Built to be found", p: "Clean, well-structured pages that search engines can read easily, instead of the tangled output most builders produce." },
  { h: "Fast to launch, once you're happy", p: "Once you've approved the design, we move quickly to build every page from it - so a full site can go live in days, not months." },
];

export default function Rebuild() {
  return (
    <>
      <Nav />
      <main id="main-content">
      <section className="mx-auto max-w-[1080px] px-5 sm:px-8 py-[clamp(80px,13vw,150px)] pb-[clamp(56px,8vw,90px)]">
          <h1 className="mb-6 max-w-[16ch] font-display text-[clamp(2.6rem,6.2vw,4.6rem)] font-extrabold leading-[1.04] tracking-tight">
            Already have a site? Here&apos;s why it might be working against you.
          </h1>
          <p className="max-w-[38rem] text-[1.1rem] text-mute">
            If it was put together with a template or an AI builder, visitors can usually tell within seconds - and what they decide in those seconds shapes whether they trust or not. AI can get you surprisingly far. The problem is stopping there. We take AI-generated and builder-made websites and turn them into something more considered, performant and customised for your business.
          </p>
        </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,110px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-9 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            People judge your site before they read a word of it
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-x-12 p-0 sm:grid-cols-2">
            {STATS.map((s, i) => (
              <li key={s.b} className={`border-line py-7 ${i ? "border-t" : ""} ${i < 2 ? "sm:border-t-0" : "sm:border-t"}`}>
                <strong className="mb-1 block font-display text-[clamp(2.2rem,4.6vw,3.2rem)] font-extrabold tracking-tight text-ink">{s.b}</strong>
                <p className="m-0 max-w-[40ch] text-mute">{s.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line py-[clamp(56px,9vw,100px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-9 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            Why templated and AI-built sites tend to feel this way
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2">
            <li>
              <h3 className="mb-2 text-[1.1rem] font-semibold text-mute">They look the same</h3>
              <p className="m-0 text-ink">
                Auto-generated sites lean on the same handful of layouts and component libraries, so most of them share the same rhythm and the same stock feel - even across completely different businesses. Visitors notice, even if they can't say exactly why.
              </p>
            </li>
            <li>
              <h3 className="mb-2 text-[1.1rem] font-semibold text-mute">They&apos;re heavier than they need to be</h3>
              <p className="m-0 text-ink">
                Every extra script the builder ships loads for every visitor, whether your page uses it or not. That's the weight behind the slow first load and the laggy scroll - and slowness is exactly what makes people suspicious that a site isn't real.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,110px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-9 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            What we do differently
          </h2>
          <ul className="m-0 list-none p-0">
            {ROWS.map((r, i) => (
              <li key={r.h} className={`grid grid-cols-1 gap-2 border-line py-6 sm:grid-cols-[1fr_1.5fr] sm:gap-12 ${i ? "border-t" : ""}`}>
                <h3 className="m-0 font-display text-xl font-semibold">{r.h}</h3>
                <p className="m-0 max-w-[44ch] text-mute">{r.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,100px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <h2 className="mb-4 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-tight">
            Want a second opinion on your site?
          </h2>
          <p className="mb-7 max-w-[32rem] text-mute">
            Send us the link, whatever built it. We'll look it over and tell you what's working, what's likely costing you visitors, and what a rebuild would change - no obligation either way.
          </p>
          <Link href="/contact" className="inline-block rounded-md border border-ink bg-ink px-6 py-3 font-medium text-[#05070d] no-underline hover:border-acc hover:bg-acc">
            Contact us
          </Link>
        </div>
      </section>
      </main>
    </>
  );
}
