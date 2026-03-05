import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e0edff,_#fff)] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">MedPortal</p>
            <p className="text-base font-semibold text-slate-900">Secure patient access</p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          Need an account? <Link href="/" className="text-brand">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
