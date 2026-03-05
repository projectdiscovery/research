import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appointments, doctorPatientList, doctors, UserRole } from "@/lib/data";
import { authOptions } from "@/lib/auth";

function PatientAppointmentView() {
  const upcoming = appointments.filter((appt) => appt.status === "scheduled");
  const past = appointments.filter((appt) => appt.status !== "scheduled");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book an appointment</CardTitle>
          <p className="text-sm text-slate-500">Select a specialty, clinician, and preferred time.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Specialty
              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
                {doctors.map((doctor) => (
                  <option key={doctor.id}>{doctor.specialty}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Doctor
              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
                {doctors.map((doctor) => (
                  <option key={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Preferred date
              <Input type="date" className="mt-2" />
            </label>
            <label className="text-sm text-slate-600">
              Preferred time
              <Input type="time" className="mt-2" />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto">
                Submit request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcoming.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <p>{appointment.doctor}</p>
                  <p>{appointment.date}</p>
                </div>
                <p className="text-slate-500">{appointment.specialty}</p>
                <p className="mt-2 text-slate-500">{appointment.time} • {appointment.location}</p>
                <Button variant="ghost" size="sm" className="mt-3 text-brand">Cancel appointment</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Previous visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {past.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <p>{appointment.doctor}</p>
                  <p>{appointment.date}</p>
                </div>
                <p className="text-slate-500">{appointment.specialty}</p>
                <p className="mt-2 text-slate-500">Status: {appointment.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DoctorAppointmentView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clinic schedule</CardTitle>
          <p className="text-sm text-slate-500">Manage availability and override bookings.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{appointment.doctor}</p>
                  <p>{appointment.date} · {appointment.time}</p>
                </div>
                <Button variant="secondary" size="sm">Reschedule</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Availability overrides</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Date" />
          <Input placeholder="Start" />
          <Input placeholder="End" />
          <Button className="md:col-span-3">Publish changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NurseAppointmentView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment check-ins</CardTitle>
        <p className="text-sm text-slate-500">Mark arrivals and prepare vitals.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="rounded-2xl border border-slate-100 p-4">
            <p className="font-semibold text-slate-900">{appointment.doctor}</p>
            <p className="text-sm text-slate-500">{appointment.date} · {appointment.time}</p>
            <Button variant="secondary" size="sm" className="mt-3">Check-in patient</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdminAppointmentView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Override appointments</CardTitle>
        <p className="text-sm text-slate-500">Admins can reassign clinicians and departments.</p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Appointment ID" />
        <Input placeholder="New doctor" />
        <Input placeholder="Department" />
        <Input placeholder="Reason" />
        <Button className="md:col-span-4">Override now</Button>
      </CardContent>
    </Card>
  );
}

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user.role as UserRole) ?? "PATIENT";

  if (role === "DOCTOR") {
    return <DoctorAppointmentView />;
  }
  if (role === "NURSE") {
    return <NurseAppointmentView />;
  }
  if (role === "ADMIN") {
    return <AdminAppointmentView />;
  }
  return <PatientAppointmentView />;
}
