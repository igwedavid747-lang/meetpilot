import Link from "next/link";

const nav = [
  ["Overview", "/dashboard"], ["Calendar", "/dashboard/calendar"], ["Availability", "/dashboard/availability"], ["Event types", "/dashboard/event-types"], ["Booking page", "/book/alex-morgan"],
];

export function WorkspaceShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[230px_1fr]">
    <aside className="border-b bg-white px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r"><Link href="/" className="text-xl font-bold tracking-tight">Meet<span className="text-brand-600">Pilot</span></Link><nav className="mt-8 flex gap-1 overflow-auto lg:block">{nav.map(([label, href]) => <Link key={href} href={href} className="block whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700">{label}</Link>)}</nav><div className="mt-10 hidden rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 lg:block">Your public page is ready to share.<br /><span className="font-semibold text-slate-700">meetpilot.app/alex-morgan</span></div></aside>
    <main><header className="flex items-center justify-between border-b bg-white px-6 py-5 sm:px-9"><div><h1 className="text-xl font-bold tracking-tight">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:block">Alex Morgan</span><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">AM</span></div></header><div className="mx-auto max-w-7xl p-6 sm:p-9">{children}</div></main>
  </div>;
}
