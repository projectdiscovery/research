import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { patientProfile, UserRole } from "@/lib/data";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user.role as UserRole) ?? "PATIENT";

  if (role === "PATIENT") {
    return (
      <section className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback className="bg-brand/10 text-brand">AJ</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{patientProfile.name}</CardTitle>
                <p className="text-sm text-slate-500">Primary physician · {patientProfile.primaryDoctor}</p>
              </div>
            </div>
            <div className="grid gap-1 text-sm text-slate-500">
              <p>Patient ID: {patientProfile.id}</p>
              <p>Member since: 2018</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-400">Contact</p>
              <p className="text-base font-medium text-slate-900">{patientProfile.email}</p>
              <p className="text-slate-500">{patientProfile.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Birth date</p>
              <p className="text-base font-medium text-slate-900">{patientProfile.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Insurance</p>
              <p className="text-base font-medium text-slate-900">{patientProfile.insuranceProvider}</p>
              <p className="text-slate-500">#{patientProfile.insuranceNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Allergies</p>
              <p className="text-base font-medium text-slate-900">{patientProfile.allergies.join(", ")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Update profile & insurance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Address" />
              <Input placeholder="City" />
              <Input placeholder="State" />
              <Input placeholder="Postal code" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="Insurance provider" />
              <Input placeholder="Plan number" />
              <Input placeholder="Group number" />
            </div>
            <Button className="w-full">Save profile</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team profile</CardTitle>
        <p className="text-sm text-slate-500">Signed in as {session.user.name}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>Your role grants access to department dashboards. Update availability inside the appointments tab.</p>
        <Button variant="secondary" className="w-full">Go to dashboard</Button>
      </CardContent>
    </Card>
  );
}
