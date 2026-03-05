"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAnalytics, labOrdersQueue, auditTrail, bulkImportJobs } from "@/lib/data";
import { Users, Activity, RefreshCw, Shield, Upload } from "lucide-react";

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 to-brand px-8 py-10 text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">System administrator</p>
        <h1 className="mt-3 text-3xl font-semibold">Operational snapshot</h1>
        <p className="text-white/80">Manage departments, analytics, and overrides.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {adminAnalytics.map((metric) => (
          <Card key={metric.label} className="border-none bg-white shadow-lg">
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
              <CardDescription>Trend {metric.trend}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User management</CardTitle>
            <CardDescription>Create roles and manage permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Name" />
              <Input placeholder="Email" />
              <select className="h-11 rounded-2xl border border-slate-200 px-3">
                <option>Patient</option>
                <option>Doctor</option>
                <option>Nurse</option>
                <option>Lab Tech</option>
                <option>Admin</option>
              </select>
              <Input type="password" placeholder="Temp password" />
            </div>
            <Button className="w-full"><Users className="mr-2 h-4 w-4" /> Create user</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Department management</CardTitle>
            <CardDescription>Update service line capacity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Input placeholder="Department name" />
            <Input placeholder="Description" />
            <Button className="w-full"><Activity className="mr-2 h-4 w-4" /> Save department</Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Appointment overrides</CardTitle>
          <CardDescription>Escalate requests or reassign clinicians.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-2xl border border-dashed border-brand/30 p-4">
            <p className="font-semibold text-slate-900">Pending overrides</p>
            <p>{labOrdersQueue.length} requests awaiting review</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Appointment ID" />
            <Input placeholder="New physician" />
            <Input placeholder="Reason" />
          </div>
          <Button variant="secondary" className="w-full"><RefreshCw className="mr-2 h-4 w-4" /> Override appointment</Button>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>Track who accessed PHI and when.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {auditTrail.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-100 p-3">
                <p className="font-semibold text-slate-900">{entry.actor}</p>
                <p>{entry.action} · {entry.resource}</p>
                <p className="text-xs text-slate-400">{entry.timestamp}</p>
              </div>
            ))}
            <Button variant="secondary" className="w-full"><Shield className="mr-2 h-4 w-4" /> Export audit log</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bulk imports</CardTitle>
            <CardDescription>Upload CSVs to create accounts in bulk.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {bulkImportJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-100 p-3">
                <p className="font-semibold text-slate-900">{job.fileName}</p>
                <p>Status: {job.status}</p>
                <p>{job.processed}</p>
                {job.errors ? <p className="text-amber-600">{job.errors}</p> : null}
              </div>
            ))}
            <div className="space-y-2">
              <Input placeholder="CSV file path" />
              <Button className="w-full"><Upload className="mr-2 h-4 w-4" /> Upload CSV</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
