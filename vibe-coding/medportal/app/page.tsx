import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, ShieldCheck, Stethoscope } from "lucide-react";

const features = [
  {
    title: "Personalized Care",
    description: "View your care plan, labs, and physician updates in one secure place.",
    icon: Stethoscope
  },
  {
    title: "Hassle-free Scheduling",
    description: "Book or adjust appointments instantly with specialty availability.",
    icon: CalendarDays
  },
  {
    title: "Enterprise-grade Security",
    description: "Protected by industry-leading encryption and compliance tooling.",
    icon: ShieldCheck
  }
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 gradient-bg opacity-10" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 pb-24 pt-24 sm:pt-32">
        <header className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand">MedPortal</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Connected care, wherever you are.
            </h1>
            <p className="mt-6 text-lg text-slate-500">
              MedPortal brings your physicians, medical records, and prescriptions together so you can manage health journeys with clarity and confidence.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">Enter patient portal</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="#features">Explore features</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl bg-white/70 p-8 shadow-2xl backdrop-blur">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase text-slate-400">Next appointment</p>
                <p className="text-2xl font-semibold text-slate-900">Apr 8 · 11:15 AM</p>
                <p className="text-slate-500">Cardiology with Dr. Simone Alvarez</p>
              </div>
              <div className="rounded-2xl bg-brand/10 p-5 text-sm text-brand-dark">
                "MedPortal gives me instant insight into my labs and medications without waiting on phone calls."
                <p className="mt-3 font-semibold text-slate-900">- Avery Johnson</p>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-center text-sm text-slate-500">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <dt>Specialists</dt>
                  <dd className="text-3xl font-semibold text-slate-900">140+</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <dt>Patient satisfaction</dt>
                  <dd className="text-3xl font-semibold text-slate-900">98%</dd>
                </div>
              </dl>
            </div>
          </div>
        </header>
        <section id="features" className="rounded-3xl bg-white p-10 shadow-2xl">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
