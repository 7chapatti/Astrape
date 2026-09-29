import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "About — Astrape",
  description:
    "Why Astrape is named for lightning, and what the studio is trying to build for the businesses it works with.",
};

export default function About() {
  return (
    <>
      <Nav active="/about" />
      <main>
      <div className="mx-auto max-w-[720px] px-5 sm:px-8">
        <section className="py-[clamp(80px,13vw,140px)] pb-[clamp(40px,6vw,64px)]">
          <h1 className="mb-5 max-w-[14ch] font-display text-[clamp(2.6rem,6vw,4rem)] font-extrabold leading-[1.06] tracking-tight">
            About Astrape
          </h1>
          <p className="max-w-[34rem] text-[1.15rem] text-mute">
            A small studio built around one idea: a website is often the only impression a business gets to make, so it shouldn&apos;t look like everyone else&apos;s.
          </p>
        </section>

        <section className="border-t border-line py-[clamp(48px,8vw,84px)]">
          <div className="mb-1 font-display text-[3.2rem] font-extrabold tracking-tight text-acc">Ἀστραπή</div>
          <p className="mb-6 text-mute">Astrapē — Greek for &quot;lightning.&quot;</p>
          <p className="m-0 leading-[1.7]">
            The name comes from the moment a strike actually happens: fast, sudden, and impossible not to notice. That&apos;s the standard we build to. A site should load the instant someone taps it, and it should look like nothing they&apos;ve seen from a builder before — not a slow, generic imitation of a real business, but the real thing.
          </p>
        </section>

        <section className="border-t border-line py-[clamp(48px,8vw,84px)]">
          <h2 className="mb-5 max-w-[20ch] font-display text-[clamp(1.7rem,3.6vw,2.3rem)] font-bold leading-tight tracking-tight">
            What we&apos;re trying to do
          </h2>
          <p className="mb-5 leading-[1.7]">
            Most small businesses end up choosing between two bad options: pay a lot for a site that takes months, or use a builder that hands them something templated, slow, and forgettable. Astrape exists to give people a third option — a site that&apos;s actually built around their business, done properly, without the usual wait or the usual price tag.
          </p>
          <p className="m-0 leading-[1.7]">
            Right now that means websites. Over time, the plan is to grow into a small studio that builds real software for the businesses we work with — not just the site someone lands on, but the tools they use to run things day to day.
          </p>
        </section>
      </div>
      </main>
    </>
  );
}
