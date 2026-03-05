import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { labResults, medicalRecords, doctorPatientList, nurseVitals, labOrdersQueue, UserRole } from "@/lib/data";
import { authOptions } from "@/lib/auth";

function PatientRecordsView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visit summaries</CardTitle>
          <p className="text-sm text-slate-500">Download encounter notes and physician updates.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicalRecords.map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{record.title}</p>
                  <p className="text-slate-500">{record.department}</p>
                </div>
                <p className="text-slate-400">{record.date}</p>
              </div>
              <p className="mt-3 text-slate-600">{record.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Laboratory results</CardTitle>
          <p className="text-sm text-slate-500">Track progress and watch list items.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {labResults.map((result) => (
            <div key={result.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{result.test}</p>
                  <p className="text-slate-500">{result.date}</p>
                </div>
                <Badge variant={result.status === "normal" ? "success" : "warning"}>{result.status}</Badge>
              </div>
              <p className="mt-3 text-slate-600">{result.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DoctorRecordsView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient medical records</CardTitle>
          <p className="text-sm text-slate-500">Access charts for your active panel.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {doctorPatientList.map((patient) => (
            <div key={patient.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
              <p className="text-base font-semibold text-slate-900">{patient.name}</p>
              <p>{patient.condition}</p>
              <p className="text-xs text-slate-400">Last visit {patient.lastVisit}</p>
              <button className="mt-2 text-sm font-medium text-brand">Open record</button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NurseRecordsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department records</CardTitle>
        <p className="text-sm text-slate-500">Vitals captured today.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {nurseVitals.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-slate-100 p-4">
            <p className="font-semibold text-slate-900">{entry.patient}</p>
            <p className="text-sm text-slate-500">{entry.department}</p>
            <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Heart rate {entry.heartRate} bpm</p>
              <p>Blood pressure {entry.bloodPressure}</p>
              <p>Temperature {entry.temperature}</p>
              <p>Recorded {entry.recordedAt}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LabRecordsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending lab uploads</CardTitle>
        <p className="text-sm text-slate-500">Attach PDFs and mark tests complete.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {labOrdersQueue.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
            <p className="text-base font-semibold text-slate-900">{order.test}</p>
            <p>{order.patient}</p>
            <p className="text-xs uppercase text-amber-600">{order.status}</p>
            <button className="mt-2 text-sm font-medium text-brand">Upload results</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function RecordsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user.role as UserRole) ?? "PATIENT";

  if (role === "DOCTOR") {
    return <DoctorRecordsView />;
  }
  if (role === "NURSE") {
    return <NurseRecordsView />;
  }
  if (role === "LAB_TECH") {
    return <LabRecordsView />;
  }
  return <PatientRecordsView />;
}
