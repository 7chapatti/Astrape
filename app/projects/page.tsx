import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Projects — Astrape",
  description:
    "A look at what Astrape has built, including StudyFlow — a live study planning app — and past project work.",
};

export default function Projects() {
  return (
    <>
      <Nav />
      <main id="main-content">
      <section className="mx-auto max-w-[1080px] px-5 sm:px-8 py-[clamp(80px,13vw,140px)] pb-[clamp(48px,7vw,72px)]">
          <h1 className="mb-4 max-w-[16ch] font-display text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight">
            Some of what we&apos;ve built
          </h1>
          <p className="max-w-[38rem] text-[1.12rem] text-mute">
            A mix of shipped work and earlier projects that show how we approach a build, end to end.
          </p>
        </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,100px)]" aria-labelledby="studyflow-h">
        <article className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="studyflow-h" className="m-0 font-display text-[clamp(1.9rem,4vw,2.6rem)] font-bold leading-tight tracking-tight">StudyFlow</h2>
            <p className="m-0 whitespace-nowrap rounded-[5px] border border-line px-3 py-1 text-sm text-acc">Live</p>
          </div>
          <p className="mb-9 max-w-[52ch] text-[1.08rem] text-mute">
            A study planning app that helps university students actually stick to a schedule, instead of just writing one down and abandoning it.
          </p>
          <dl className="m-0 grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div>
              <dt className="mb-2 text-[1.05rem] font-semibold">The problem</dt>
              <dd className="m-0 text-mute">Most study planners are just calendars. They don&apos;t account for how long a task really takes, or when a student actually has the energy to focus, so the plan falls apart within a week.</dd>
            </div>
            <div>
              <dt className="mb-2 text-[1.05rem] font-semibold">The approach</dt>
              <dd className="m-0 text-mute">Built a scheduler that learns from a student&apos;s own patterns — when they tend to study best, how long tasks actually take them — and adjusts the plan around that, instead of a fixed template.</dd>
            </div>
            <div>
              <dt className="mb-2 text-[1.05rem] font-semibold">What shipped</dt>
              <dd className="m-0 text-mute">A working billing flow for premium plans, a redesigned scheduler, and a lighter, non-AI way to estimate how long a task will take when a full recommendation isn&apos;t needed.</dd>
            </div>
            <div>
              <dt className="mb-2 text-[1.05rem] font-semibold">Where it stands</dt>
              <dd className="m-0 text-mute">Live and in active use, with every release checked against a full automated test suite before going out.</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="border-t border-line py-[clamp(56px,9vw,100px)]" aria-labelledby="vaultdrop-h">
        <article className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="vaultdrop-h" className="m-0 font-display text-[clamp(1.9rem,4vw,2.6rem)] font-bold leading-tight tracking-tight">VaultDrop</h2>
            <p className="m-0 whitespace-nowrap rounded-[5px] border border-line px-3 py-1 text-sm text-mute">University project</p>
          </div>
          <p className="max-w-[52ch] text-mute">
            An encrypted file-sharing platform built for a university course, designed so that even the platform itself can&apos;t read the files being shared. It included automatic detection of unusual account activity, and went through a full UI redesign partway through to make it feel calmer and more trustworthy to use.
          </p>
        </article>
      </section>

      <section className="border-t border-line bg-[#070b14] py-[clamp(56px,9vw,100px)]">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <p className="m-0 text-mute">More projects go here as they&apos;re finished — including client work, once we have some.</p>
        </div>
      </section>
      </main>
    </>
  );
}
