"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await signIn("credentials", {
      redirect: false,
      email,
      password
    });

    if (response?.error) {
      setError("Invalid credentials. Please try again.");
    } else if (response?.ok) {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-slate-500">Email</label>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2" />
      </div>
      <div>
        <label className="text-sm text-slate-500">Password</label>
        <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="mt-2" />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
