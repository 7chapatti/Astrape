import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact - Astrape",
  description: "Tell us what you're building. We reply within one working day.",
};

export default function Contact() {
  return (
    <>
      <Nav />
      <main id="main-content">
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <section className="py-[clamp(64px,10vw,110px)] pb-[clamp(40px,6vw,64px)]">
          <h1 className="mb-4 max-w-[15ch] font-display text-[clamp(2.4rem,5.6vw,3.6rem)] font-extrabold leading-[1.06] tracking-tight">
            Tell us what you're building
          </h1>
          <p className="max-w-[36rem] text-[1.1rem]">A few details to get started. We usually reply within one working day.</p>
        </section>
        <ContactForm />
      </div>
      </main>
    </>
  );
}
