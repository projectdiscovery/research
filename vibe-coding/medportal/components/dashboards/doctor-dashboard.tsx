"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doctorPatientList, labOrdersQueue, referrals, refillRequests, waitlist } from "@/lib/data";
import { CalendarDays, ClipboardPen, Pill, Stethoscope, Share2, ClipboardList } from "lucide-react";

export function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-brand-dark to-brand px-8 py-10 text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Clinician workspace</p>
        <h1 className="mt-3 text-3xl font-semibold">Morning overview</h1>
        <p className="text-white/80">3 patients on your schedule · Availability synced to patient portal</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active patient panel</CardTitle>
            <CardDescription>View outstanding labs and care plan tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctorPatientList.map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{patient.name}</p>
                    <p className="text-sm text-slate-500">{patient.condition}</p>
                  </div>
                  <Button size="sm" variant="secondary">Open chart</Button>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                  <p>Last visit: {patient.lastVisit}</p>
                  <p>Next step: {patient.nextStep}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prescription + availability</CardTitle>
            <CardDescription>Update medication plans and clinic hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Pill className="h-4 w-4 text-brand" /> Create prescription</p>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <Input placeholder="Medication" />
                <Input placeholder="Dosage" />
                <Input placeholder="Frequency" />
                <Input placeholder="Patient ID" />
              </div>
              <Button className="mt-3 w-full">Save prescription</Button>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><CalendarDays className="h-4 w-4 text-brand" /> Manage availability</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Monday</span>
                  <Input type="text" placeholder="09:00 - 13:00" className="h-9 w-40 text-right" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Wednesday</span>
                  <Input type="text" placeholder="10:00 - 15:00" className="h-9 w-40 text-right" />
                </div>
              </div>
              <Button variant="secondary" className="mt-3 w-full">Sync with portal</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referrals</CardTitle>
            <CardDescription>Manage inbound/outbound specialists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {referrals.map((referral) => (
              <div key={referral.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">
                  {referral.patient} · {referral.toDoctor}
                </p>
                <p className="text-slate-500">{referral.notes}</p>
                <div className="mt-2 flex items-center gap-2 text-xs uppercase text-slate-400">
                  Status: {referral.status}
                  <Button size="sm" variant="ghost" className="text-brand">
                    <Share2 className="mr-1 h-3 w-3" /> Share records
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Refill approvals</CardTitle>
            <CardDescription>Approve or deny refill requests with limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {refillRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-base font-semibold text-slate-900">{request.medication}</p>
                <p className="text-slate-500">Requested {request.requestedOn}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm">Approve</Button>
                  <Button size="sm" variant="secondary">
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lab orders</CardTitle>
            <CardDescription>Review pending tests you've ordered.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {labOrdersQueue.slice(0, 2).map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-100 p-3">
                <p className="font-semibold text-slate-900">{order.test}</p>
                <p>{order.patient}</p>
                <p className="text-xs uppercase text-amber-600">{order.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clinical notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea className="h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-600" placeholder="Document today's visit summary..." />
            <Button className="mt-3 w-full"><ClipboardPen className="mr-2 h-4 w-4" /> Save note</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Care coordination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-dashed border-brand/30 p-4">
              <p className="font-semibold text-slate-900">Send update to nurse team</p>
              <p>Flag patients needing vitals follow up.</p>
            </div>
            <Button variant="secondary" className="w-full"><Stethoscope className="mr-2 h-4 w-4" /> Message nurse station</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Waitlist + blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 p-3">
              <p className="font-semibold text-slate-900">Waitlist</p>
              {waitlist.map((entry) => (
                <p key={entry.id}>
                  {entry.patient} · {entry.preferredDate} ({entry.status})
                </p>
              ))}
              <Button variant="ghost" className="mt-2 text-brand">
                <ClipboardList className="mr-1 h-4 w-4" /> Offer slot
              </Button>
            </div>
            <div className="rounded-2xl border border-dashed border-amber-200 p-3">
              <p className="font-semibold text-slate-900">Block time</p>
              <Input placeholder="Start" className="mt-2" />
              <Input placeholder="End" className="mt-2" />
              <Button size="sm" className="mt-2 w-full">
                Save block
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
