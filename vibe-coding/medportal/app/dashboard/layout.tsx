import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Stethoscope, LogOut } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { NotificationsPanel } from "@/components/notifications-panel";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GlobalSearch } from "@/components/search/global-search";
import { notificationsByRole, UserRole } from "@/lib/data";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = (session.user.role as UserRole) ?? "PATIENT";
  const roleLabel = role
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
  const notifications = notificationsByRole[role] ?? [];

  return (
    <div className="min-h-screen bg-[#edf2fb] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl gap-6">
        <Sidebar role={role} />
        <div className="flex-1">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">MedPortal</p>
                <p className="font-semibold text-slate-900">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link href="/" className="font-medium text-brand">
                Back home
              </Link>
              <SignOutButton className="border-none p-0 text-slate-500 hover:text-slate-900">
                <LogOut className="h-4 w-4" />
                Sign out
              </SignOutButton>
            </div>
          </div>
          <div className="mb-6 hidden items-center justify-between rounded-3xl border border-slate-100 bg-white px-6 py-4 shadow-sm lg:flex">
            <div>
              <p className="text-xs uppercase text-slate-400">Signed in as</p>
              <p className="text-base font-semibold text-slate-900">{session.user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationsPanel notifications={notifications} />
              <SignOutButton>
                <LogOut className="h-4 w-4" /> Sign out
              </SignOutButton>
            </div>
          </div>
          <div className="mb-6 hidden lg:block">
            <GlobalSearch />
          </div>
          <div className="space-y-6 pb-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
