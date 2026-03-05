import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prescriptions, UserRole } from "@/lib/data";
import { authOptions } from "@/lib/auth";
import { Pill, Repeat } from "lucide-react";

function PatientPrescriptionView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Active prescriptions</CardTitle>
            <p className="text-sm text-slate-500">Review dosage instructions and refill windows.</p>
          </div>
          <Button variant="secondary" className="gap-2">
            <Repeat className="h-4 w-4" /> Request refill
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{rx.medication}</p>
                  <p className="text-slate-500">{rx.dosage} · {rx.frequency}</p>
                </div>
                <Badge variant="default">Prescribed by {rx.prescribedBy}</Badge>
              </div>
              <p className="mt-3 text-slate-500">Started {rx.startDate}</p>
              {rx.endDate && <p className="text-slate-500">Ends {rx.endDate}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medication safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <Pill className="mt-0.5 h-4 w-4 text-brand" />
            <p>
              Pharmacy sync keeps interactions up to date. We'll alert you if a new prescription conflicts with your history.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-brand/30 p-4">
            Add over-the-counter medications to help clinicians get the full picture.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClinicianPrescriptionView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage prescriptions</CardTitle>
        <p className="text-sm text-slate-500">Create or update active medications for your patients.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Patient ID" />
          <Input placeholder="Medication" />
          <Input placeholder="Dosage" />
          <Input placeholder="Frequency" />
        </div>
        <Input placeholder="Instructions" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="date" placeholder="Start date" />
          <Input type="date" placeholder="End date" />
        </div>
        <Button className="w-full">Save prescription</Button>
      </CardContent>
    </Card>
  );
}

export default async function PrescriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user.role as UserRole) ?? "PATIENT";

  if (role === "DOCTOR" || role === "NURSE") {
    return <ClinicianPrescriptionView />;
  }
  return <PatientPrescriptionView />;
}
