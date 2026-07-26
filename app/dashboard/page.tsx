import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";

const appointments = [
  ["10:00", "Product discovery", "Jamie Chen", "30 min", "#dbeafe"], ["13:30", "Portfolio review", "Tanya Lewis", "45 min", "#ede9fe"], ["15:00", "Intro consultation", "Owen Brown", "30 min", "#dcfce7"],
];

export default function Dashboard() { return <WorkspaceShell title="Good morning, Alex" description="Here’s what your schedule looks like today.">
  <div className="grid gap-6 lg:grid-cols-[1.4fr_.85fr]">
    <section className="surface p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Wednesday, April 16</h2><p className="mt-1 text-sm text-slate-500">3 appointments · 1 hr 45 min booked</p></div><Link className="button-secondary" href="/dashboard/calendar">Full calendar</Link></div><div className="mt-6 space-y-3">{appointments.map(([time, title, person, duration, color]) => <div key={time} className="grid grid-cols-[56px_1fr] gap-3"><p className="pt-4 text-sm font-medium text-slate-500">{time}</p><div style={{ backgroundColor: color }} className="rounded-xl p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold text-slate-800">{title}</p><p className="mt-1 text-sm text-slate-600">{person}</p></div><span className="text-sm text-slate-500">{duration}</span></div></div></div>)}</div></section>
    <aside className="space-y-6"><section className="surface p-6"><p className="text-sm font-semibold text-slate-500">THIS WEEK</p><div className="mt-5 grid grid-cols-2 gap-3"><Stat value="12" label="Appointments" /><Stat value="8.5h" label="Time booked" /></div><Link href="/dashboard/availability" className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">Review availability →</Link></section><section className="surface p-6"><div className="flex justify-between"><h2 className="font-semibold">Share your page</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Live</span></div><p className="mt-2 text-sm leading-6 text-slate-500">Anyone with this link can choose a time that works.</p><div className="mt-4 flex rounded-xl bg-slate-50 p-2"><code className="flex-1 truncate px-2 py-1 text-xs text-slate-600">meetpilot.app/alex-morgan</code><button className="text-xs font-semibold text-brand-600">Copy</button></div><Link href="/book/alex-morgan" className="mt-4 inline-block text-sm font-semibold text-brand-600">Preview booking page →</Link></section></aside>
  </div>
</WorkspaceShell>; }
function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>; }
