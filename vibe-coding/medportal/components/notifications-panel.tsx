"use client";
'use client';

import { Bell } from "lucide-react";
import { Notification } from "@/lib/data";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function NotificationsPanel({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <Bell className="h-4 w-4 text-brand" />
        Alerts
        <span className="rounded-full bg-brand/10 px-2 text-xs text-brand">{notifications.filter((n) => !n.read).length}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
          <p className="text-xs uppercase text-slate-400">Notifications</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {notifications.map((notification) => (
              <li key={notification.id} className={cn("rounded-2xl border px-3 py-2", notification.read ? "border-slate-100" : "border-brand/30 bg-brand/5")}> 
                <p className="font-semibold text-slate-900">{notification.title}</p>
                <p>{notification.description}</p>
                <p className="text-xs text-slate-400">{notification.date}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
