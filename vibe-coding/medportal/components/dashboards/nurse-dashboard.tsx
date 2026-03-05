"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nurseVitals } from "@/lib/data";
import { HeartPulse, ClipboardCheck } from "lucide-react";

export function NurseDashboard() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-brand to-brand-light px-8 py-10 text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Nurse station</p>
        <h1 className="mt-3 text-3xl font-semibold">Check-in queue · {nurseVitals.length} patients awaiting vitals</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Today's vitals</CardTitle>
          <CardDescription>Log measurements for your department.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {nurseVitals.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{entry.patient}</p>
                  <p className="text-sm text-slate-500">{entry.department}</p>
                </div>
                <Button size="sm" variant="secondary">Update</Button>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>Heart rate: {entry.heartRate} bpm</p>
                <p>Blood pressure: {entry.bloodPressure}</p>
                <p>Temperature: {entry.temperature}</p>
                <p>Recorded: {entry.recordedAt}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update patient vitals</CardTitle>
          <CardDescription>Document new measurements before routing to physicians.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Patient ID" />
            <Input placeholder="Blood pressure" />
            <Input placeholder="Heart rate" />
            <Input placeholder="Temperature" />
          </div>
          <Input placeholder="Notes" />
          <Button className="w-full"><HeartPulse className="mr-2 h-4 w-4" /> Save vitals</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment check-ins</CardTitle>
          <CardDescription>Confirm arrivals and hand off to physicians.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="rounded-2xl border border-dashed border-brand/30 p-4">
            <p className="font-semibold text-slate-900">3 patients waiting</p>
            <p>Endocrinology suite · Average wait 04m 12s</p>
          </div>
          <Button variant="secondary" className="w-full">
            <ClipboardCheck className="mr-2 h-4 w-4" /> Start check-in flow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
