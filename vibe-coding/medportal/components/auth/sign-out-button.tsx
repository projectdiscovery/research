"use client";
'use client';

import { signOut } from "next-auth/react";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600", className)}
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {children ?? "Sign out"}
    </button>
  );
}
