"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appointments, labResults, patientProfile, prescriptions, referrals, refillRequests, shareLinks, waitlist } from "@/lib/data";
import { CalendarDays, FileText, Pill, Plus, Send, Share2, LinkIcon, ClipboardList } from "lucide-react";

export function PatientDashboard() {
  const upcoming = appointments.filter((appt) => appt.status === "scheduled").slice(0, 2);
  const latestLabs = labResults.slice(0, 2);
  const patientReferrals = referrals.filter((referral) => referral.patient === patientProfile.name);
  const patientWaitlist = waitlist.filter((entry) => entry.patient === patientProfile.name);
  const patientShareLinks = shareLinks.filter((link) => link.status === "active");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-brand to-brand-dark px-8 py-10 text-white">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">Welcome back</p>
          <h1 className="text-3xl font-semibold">{patientProfile.name}</h1>
          <p className="text-white/80">Manage appointments, medical records, and prescriptions in one place.</p>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 p-4">
            <p className="uppercase text-white/60">Next visit</p>
            <p className="text-xl font-semibold">Apr 8 · 11:15 AM</p>
            <p className="text-white/70">Cardiology consult</p>
          </div>
          <div className="rounded-2xl border border-white/20 p-4">
            <p className="uppercase text-white/60">Medications</p>
            <p className="text-xl font-semibold">{prescriptions.length} active</p>
            <p className="text-white/70">With refill reminders</p>
          </div>
          <div className="rounded-2xl border border-white/20 p-4">
            <p className="uppercase text-white/60">Lab status</p>
            <p className="text-xl font-semibold">All reviewed</p>
            <p className="text-white/70">Updated Oct 20</p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming appointments</CardTitle>
              <p className="text-sm text-slate-500">Track preparation notes and visit status</p>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Book visit
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {upcoming.map((appointment) => (
                <li key={appointment.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{appointment.doctor}</p>
                    <p className="text-sm text-slate-500">{appointment.specialty}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p className="font-semibold text-slate-900">{appointment.date}</p>
                    <p>{appointment.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent updates</CardTitle>
            <p className="text-sm text-slate-500">Stay informed about labs and care plan adjustments.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestLabs.map((lab) => (
                <div key={lab.id} className="flex items-start justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{lab.test}</p>
                    <p className="text-sm text-slate-500">{lab.date}</p>
                    <p className="mt-2 text-sm text-slate-600">{lab.summary}</p>
                  </div>
                  <Badge variant={lab.status === "normal" ? "success" : "attention"}>{lab.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-white">Care team</CardTitle>
            <p className="text-sm text-white/70">2 specialists actively monitoring</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/80">
            <p>Primary care: Dr. Maya Patel</p>
            <p>Neurology: Dr. Marcus Lee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Button variant="secondary" className="justify-start">
              <CalendarDays className="mr-2 h-4 w-4" /> View schedule
            </Button>
            <Button variant="secondary" className="justify-start">
              <FileText className="mr-2 h-4 w-4" /> Download visit summary
            </Button>
            <Button variant="secondary" className="justify-start">
              <Pill className="mr-2 h-4 w-4" /> Request refill
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Message care team</CardTitle>
            <p className="text-sm text-slate-500">Send updates to your assigned doctor.</p>
          </CardHeader>
          <CardContent>
            <textarea className="h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-600" placeholder="Share symptoms, questions, or updates" />
            <Button className="mt-3 w-full">
              <Send className="mr-2 h-4 w-4" /> Send secure message
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referrals & waitlist</CardTitle>
            <p className="text-sm text-slate-500">Monitor specialist access and backup slots.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {patientReferrals.map((referral) => (
              <div key={referral.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-base font-semibold text-slate-900">{referral.toDoctor}</p>
                <p className="text-slate-500">{referral.notes}</p>
                <Badge className="mt-2 capitalize" variant={referral.status === "accepted" ? "success" : referral.status === "pending" ? "warning" : "default"}>
                  {referral.status}
                </Badge>
              </div>
            ))}
            {patientWaitlist.length ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Waitlist entries</p>
                {patientWaitlist.map((entry) => (
                  <p key={entry.id}>
                    {entry.doctor} · {entry.preferredDate} ({entry.status})
                  </p>
                ))}
                <Button variant="ghost" className="mt-2 text-brand">
                  <ClipboardList className="mr-2 h-4 w-4" /> Manage waitlist
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prescription refills</CardTitle>
            <p className="text-sm text-slate-500">View status and limits before expiration.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {refillRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-base font-semibold text-slate-900">{request.medication}</p>
                <p className="text-slate-500">Requested {request.requestedOn}</p>
                <p className="text-xs text-slate-400 capitalize">Status: {request.status}</p>
                {request.denialReason ? <p className="mt-2 text-rose-500">Reason: {request.denialReason}</p> : null}
              </div>
            ))}
            <Button className="w-full">Request new refill</Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Secure sharing</CardTitle>
            <p className="text-sm text-slate-500">Generate temporary links for outside providers.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {patientShareLinks.map((link) => (
              <div key={link.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="flex items-center gap-2 font-semibold text-slate-900">
                  <LinkIcon className="h-4 w-4 text-brand" /> {link.url}
                </p>
                <p className="text-slate-500">Expires in {link.expires}</p>
              </div>
            ))}
            <Button variant="secondary" className="w-full">
              <Share2 className="mr-2 h-4 w-4" /> Generate new link
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications & reminders</CardTitle>
            <p className="text-sm text-slate-500">Refill limits, waitlist status, and referral access.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Refills remaining: {prescriptions[0]?.startDate ? "Metformin · 1 of 3 left" : "N/A"}</p>
            <p>Referral access active until Jun 30.</p>
            <Button variant="ghost" className="justify-start text-brand">
              View notification center
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
