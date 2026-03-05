import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/lib/data";
import { PatientDashboard } from "@/components/dashboards/patient-dashboard";
import { DoctorDashboard } from "@/components/dashboards/doctor-dashboard";
import { NurseDashboard } from "@/components/dashboards/nurse-dashboard";
import { LabDashboard } from "@/components/dashboards/lab-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = (session.user.role as UserRole) ?? "PATIENT";

  if (role === "DOCTOR") {
    return <DoctorDashboard />;
  }
  if (role === "NURSE") {
    return <NurseDashboard />;
  }
  if (role === "LAB_TECH") {
    return <LabDashboard />;
  }
  if (role === "ADMIN") {
    return <AdminDashboard />;
  }
  return <PatientDashboard />;
}
