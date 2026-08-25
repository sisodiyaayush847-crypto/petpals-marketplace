"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const presetRole = params.get("role") === "vendor" ? "vendor" : "customer";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "vendor">(presetRole);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // If email confirmation is off, session exists immediately.
    if (data.session) {
      router.push(role === "vendor" ? "/vendor/onboarding" : "/account");
      router.refresh();
    } else {
      setMsg("Check your email to confirm your account, then sign in.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
      <p className="mt-1 text-sm text-gray-500">Join PetPals as a customer or provider.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("customer")}
          className={`rounded-lg border px-3 py-2 text-sm ${
            role === "customer" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300"
          }`}
        >
          🐶 I'm a Pet Parent
        </button>
        <button
          type="button"
          onClick={() => setRole("vendor")}
          className={`rounded-lg border px-3 py-2 text-sm ${
            role === "vendor" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300"
          }`}
        >
          🏪 I'm a Provider
        </button>
      </div>

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={fullName}
            onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={6} value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
