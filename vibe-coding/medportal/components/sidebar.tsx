"use client";
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/data";
import { MessageSquare, Stethoscope, CalendarDays, FileText, Pill, LayoutDashboard, UserRound } from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["PATIENT", "DOCTOR", "NURSE", "LAB_TECH", "ADMIN"] },
  { name: "Profile", href: "/dashboard/profile", icon: UserRound, roles: ["PATIENT", "DOCTOR", "NURSE"] },
  { name: "Appointments", href: "/dashboard/appointments", icon: CalendarDays, roles: ["PATIENT", "DOCTOR", "NURSE", "ADMIN"] },
  { name: "Records", href: "/dashboard/records", icon: FileText, roles: ["PATIENT", "DOCTOR", "NURSE", "LAB_TECH"] },
  { name: "Prescriptions", href: "/dashboard/prescriptions", icon: Pill, roles: ["PATIENT", "DOCTOR", "NURSE"] },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, roles: ["PATIENT", "DOCTOR", "NURSE"] }
];

type SidebarProps = {
  role?: UserRole;
};

export const Sidebar = ({ role = "PATIENT" }: SidebarProps) => {
  const pathname = usePathname();
  const roleLabel = role
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return (
    <aside className="hidden w-64 flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:flex">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">MedPortal</p>
          <p className="text-base font-semibold text-slate-900">{roleLabel}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems
          .filter((item) => item.roles.includes(role))
          .map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
        <p className="font-semibold text-slate-700">Need help?</p>
        <p>Our care team is available 24/7 to assist with urgent needs.</p>
      </div>
    </aside>
  );
};
