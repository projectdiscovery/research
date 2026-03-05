"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labOrdersQueue } from "@/lib/data";
import { FlaskConical, CheckCircle2 } from "lucide-react";

export function LabDashboard() {
  const pending = labOrdersQueue.filter((order) => order.status !== "completed");

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-brand-dark to-sky-500 px-8 py-10 text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Diagnostics queue</p>
        <h1 className="mt-3 text-3xl font-semibold">{pending.length} pending orders</h1>
        <p className="text-white/80">Upload attachments and mark tests complete.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Lab orders</CardTitle>
          <CardDescription>Assign technicians and update status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {labOrdersQueue.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>
                  <p className="text-base font-semibold text-slate-900">{order.test}</p>
                  <p>{order.patient}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase">{order.status}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <p>Priority: {order.priority}</p>
                <p>Technician: {order.assignedTo ?? "Unassigned"}</p>
              </div>
              <Button variant="secondary" size="sm" className="mt-3">Attach result</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload lab results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Input placeholder="Lab order ID" />
          <Input type="file" />
          <Input placeholder="Summary" />
          <Button className="w-full">
            <FlaskConical className="mr-2 h-4 w-4" /> Submit result
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Release workflow</CardTitle>
          <CardDescription>Patients see results after physician review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand" />
            <p>Upload PDF/image attachments for each order. Attach technician notes and QA status.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand" />
            <p>Ordering doctor annotates results, marks them released, and triggers patient notifications.</p>
          </div>
          <Button variant="secondary" className="w-full">
            View pending releases
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
