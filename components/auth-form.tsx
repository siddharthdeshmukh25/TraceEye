"use client";

import { Leaf, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, googleProvider, auth } from "@/lib/firebase";
import { setAuth } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Call backend to create user and get proper JWT token
      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Google sign-in failed");
      }

      const { token, user: userData } = await response.json();
      
      // Store token and user data
      setAuth(token, userData);
      
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    
    if (!email.includes("@") || password.length < 6 || (isSignup && !name.trim())) {
      setError("Please enter a valid email and a password with at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      
      // For email/password, use MongoDB-based auth
      const result = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: isSignup ? name.trim() : undefined,
          mode: isSignup ? "signup" : "login"
        })
      });

      if (!result.ok) {
        const error = await result.json();
        throw new Error(error.detail || "Authentication failed");
      }

      const { token, user } = await result.json();
      
      // Store token and user data
      setAuth(token, user);
      
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink">
            <Leaf size={21}/>
          </span>
          <span className="brand-wordmark">TraceEye</span>
        </Link>
        <div>
          <p className="text-sm font-bold tracking-widest text-lime">TRUST IN MOTION</p>
          <h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight">Every food journey deserves proof.</h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-emerald-100/70">Join the connected workspace for safer food, accountable handovers, and trusted product information.</p>
        </div>
        <p className="text-sm text-emerald-100/50">Secure food traceability for modern supply chains.</p>
      </section>
      
      <section className="flex items-center justify-center p-5 py-10 sm:p-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-lime">
              <Leaf size={21}/>
            </span>
            <span className="brand-wordmark">TraceEye</span>
          </Link>
          
          <p className="text-sm font-bold tracking-widest text-forest">
            {isSignup ? "CREATE YOUR WORKSPACE" : "WELCOME BACK"}
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            {isSignup ? "Start with TraceEye" : "Log in to TraceEye"}
          </h2>
          <p className="mt-3 text-slate-500">
            {isSignup ? "Create your account to access the traceability dashboard." : "Enter your details to access your dashboard."}
          </p>
          
          <div className="mt-7">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignup ? "Sign up with Google" : "Sign in with Google"}
            </button>
          </div>
          
          <div className="my-6 flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="h-px flex-1 bg-slate-200"/>
            OR CONTINUE WITH EMAIL
            <span className="h-px flex-1 bg-slate-200"/>
          </div>
          
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {isSignup && (
              <label className="block text-sm font-bold">
                Full name
                <div className="relative mt-2">
                  <UserRound className="absolute left-3 top-3 text-slate-400" size={18}/>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 outline-none transition focus:border-forest"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </label>
            )}
            
            <label className="block text-sm font-bold">
              Email address
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 outline-none transition focus:border-forest"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </label>
            
            <label className="block text-sm font-bold">
              Password
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 outline-none transition focus:border-forest"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </label>
            
            {error && (
              <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink py-3.5 font-bold text-white shadow-premium transition hover:bg-forest disabled:opacity-50"
            >
              {loading ? "Processing..." : (isSignup ? "Create account" : "Log in")}
            </button>
          </form>
          
          <p className="mt-7 text-center text-sm text-slate-500">
            {isSignup ? "Already have an account?" : "New to TraceEye?"}{" "}
            <Link className="font-bold text-forest" href={isSignup ? "/auth/login" : "/auth/signup"}>
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
