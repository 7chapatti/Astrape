import Link from "next/link";
import LightningHero from "@/components/LightningHero";

const SERVICES = [
  { h: "Lightning-fast loading", p: "Pages load in a flash. Fast sites keep visitors around, and search engines notice." },
  { h: "Custom design", p: "No templates. Every layout is drawn around your brand and the people you want to reach." },
  { h: "Built to be found", p: "Clean structure and quick pages that search engines can read without struggling." },
  { h: "Live in days", p: "Once you approve the design, we move quickly. Most sites launch in days, not months." },
];

export default function Home() {
  return (
    <>
      <LightningHero />
      <main id="main-content">
        <section id="services" className="border-t border-line py-[clamp(72px,12vw,140px)]">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
            <h2 className="mb-10 max-w-[18ch] font-display text-[clamp(2rem,4.6vw,3.3rem)] font-bold leading-[1.05] tracking-tight">
              What we build for you
            </h2>
            <ul className="m-0 list-none p-0">
              {SERVICES.map((s, i) => (
                <li key={s.h} className={`grid grid-cols-1 gap-2 border-line py-6 sm:grid-cols-[1fr_1.4fr] sm:gap-12 ${i ? "border-t" : ""}`}>
                  <h3 className="m-0 font-display text-2xl font-semibold">{s.h}</h3>
                  <p className="m-0 max-w-[46ch] text-mute">{s.p}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="rebuild" className="border-t border-line bg-[#070b14] py-[clamp(72px,12vw,140px)]">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
            <h2 className="mb-6 max-w-[18ch] font-display text-[clamp(2rem,4.6vw,3.3rem)] font-bold leading-[1.05] tracking-tight">
              Already have a website?
            </h2>
            <p className="mb-7 max-w-[46ch] text-mute">
              Built it with a site builder or an AI tool, and it feels slow or looks like everyone else&apos;s? Send it over. We&apos;ll rebuild it into something faster and clearly yours.
            </p>
            <Link href="/rebuild" className="inline-block rounded-md border border-ink bg-ink px-6 py-3 font-medium text-[#05070d] no-underline hover:border-acc hover:bg-acc">
              Learn more
            </Link>
          </div>
        </section>

        <section id="contact" className="border-t border-line py-[clamp(72px,12vw,140px)]">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
            <h2 className="mb-6 max-w-[18ch] font-display text-[clamp(2rem,4.6vw,3.3rem)] font-bold leading-[1.05] tracking-tight">
              Tell us what you&apos;re building.
            </h2>
            <p className="mb-7 text-mute">We reply within one working day.</p>
            <Link href="/contact" className="inline-block rounded-md border border-ink bg-ink px-6 py-3 font-medium text-[#05070d] no-underline hover:border-acc hover:bg-acc">
              Contact us
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
