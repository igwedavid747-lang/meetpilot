import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="motion-enter flex items-center justify-between py-6 sm:py-8">
          <Link href="/" className="text-xl font-bold tracking-tight" aria-label="MeetPilot home">Meet<span className="text-brand-600">Pilot</span></Link>
          <Link href="/dashboard" className="button-secondary min-h-11 px-4">Open workspace</Link>
        </header>

        <section className="grid flex-1 items-center gap-12 pb-10 pt-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:gap-20 lg:pb-20 lg:pt-12">
          <div className="max-w-4xl">
            <p className="motion-enter motion-enter-delay-1 mb-7 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">Your time, thoughtfully booked</p>
            <h1 className="motion-enter motion-enter-delay-2 max-w-3xl font-serif text-[clamp(3.75rem,8vw,7.5rem)] leading-[0.82] tracking-[-0.075em] text-ink">Make time<br />feel like yours.</h1>
            <p className="motion-enter motion-enter-delay-3 mt-9 max-w-md text-[17px] leading-7 tracking-[-0.02em] text-slate-600">A calm place for clients to book, for you to stay in control, and for every meeting to land exactly where it should.</p>
            <div className="motion-enter motion-enter-delay-3 mt-9 flex flex-wrap items-center gap-5">
              <Link href="/dashboard" className="button-primary min-h-14 px-7">Create your booking page</Link>
              <Link href="/book/alex-morgan" className="motion-link border-b border-brand-600 pb-1 text-sm font-semibold text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4">See the booking flow</Link>
            </div>
          </div>

          <aside className="relative mx-auto w-full max-w-[420px] lg:mx-0">
            <div className="absolute -inset-x-4 bottom-4 top-10 rounded-3xl bg-brand-100 sm:-inset-x-7" aria-hidden="true" />
            <div className="motion-schedule surface relative p-5 sm:p-7">
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Your day at a glance</p><p className="mt-2 text-xl font-semibold tracking-[-0.05em]">Thursday, July 23</p></div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">M</span>
              </div>
              <div className="py-7"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Next open time</p><p className="mt-2 text-5xl font-semibold tracking-[-0.08em] text-ink">2:30</p><p className="mt-1 text-sm text-slate-500">PM · Lagos time</p></div>
              <div className="rounded-xl bg-ink p-5 text-white"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-100">Next meeting</p><span className="text-xs text-white/60">45 min</span></div><p className="mt-7 text-2xl font-semibold tracking-[-0.06em]">Product discovery</p><p className="mt-1 text-sm text-white/65">with Jamie Chen · 3:30 PM</p></div>
              <p className="mt-5 text-xs leading-5 text-slate-500">MeetPilot holds the gaps, buffers, and busy time—so the rest of your day can breathe.</p>
            </div>
          </aside>
        </section>

        <footer className="motion-enter motion-enter-delay-3 flex flex-col gap-3 border-t border-slate-200 py-5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Meet less. Make more room.</p><div className="flex gap-5"><span>Availability-first</span><span>Built for one-to-one</span></div></footer>
      </div>
    </main>
  );
}
