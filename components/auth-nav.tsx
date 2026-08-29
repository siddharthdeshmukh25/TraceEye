"use client";

import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { getAuth, clearAuth, isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check authentication status and auto-logout if expired
  useEffect(() => {
    const checkAuth = () => {
      const auth = getAuth();
      if (auth.token && auth.user) {
        setUser(auth.user);
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // Check token expiration every minute
    const authCheck = setInterval(() => {
      if (!isAuthenticated()) {
        clearAuth();
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(authCheck);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push('/');
  };

  const getUserInitials = () => {
    if (!user) return '';
    const name = user.full_name || user.name || user.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.full_name || user.name || user.email || 'User';
  };

  // Desktop Auth Nav
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white font-bold text-sm">
            {getUserInitials()}
          </div>
          <span className="text-sm font-semibold text-forest">{getUserDisplayName()}</span>
        </div>
        <Link href="/dashboard" className="rounded-xl bg-forest px-3 py-2.5 text-sm font-semibold text-white shadow-premium">
          Dashboard
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    );
  }

  // Desktop Login/Signup
  return (
    <div className="flex gap-2">
      <Link href="/auth/login" className="rounded-xl border border-forest px-3 py-2.5 text-sm font-semibold text-forest sm:px-5">Log in</Link>
      <Link href="/auth/signup" className="rounded-xl bg-forest px-3 py-2.5 text-sm font-semibold text-white shadow-premium sm:px-5">Sign up</Link>
    </div>
  );
}

export function MobileAuthNav({ closeMenu }: { closeMenu: () => void }) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const auth = getAuth();
      if (auth.token && auth.user) {
        setUser(auth.user);
      } else {
        setUser(null);
      }
    };

    checkAuth();

    const authCheck = setInterval(() => {
      if (!isAuthenticated()) {
        clearAuth();
        setUser(null);
      }
    }, 60000);

    return () => clearInterval(authCheck);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push('/');
  };

  const getUserInitials = () => {
    if (!user) return '';
    const name = user.full_name || user.name || user.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.full_name || user.name || user.email || 'User';
  };

  if (user) {
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
        <div className="col-span-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white font-bold text-sm">
            {getUserInitials()}
          </div>
          <span className="text-sm font-semibold text-forest">{getUserDisplayName()}</span>
        </div>
        <Link onClick={closeMenu} href="/dashboard" className="rounded-xl bg-forest py-3 text-center text-sm font-semibold text-white">Dashboard</Link>
        <button onClick={() => { handleLogout(); closeMenu(); }} className="rounded-xl border border-rose-200 bg-rose-50 py-3 text-center text-sm font-semibold text-rose-700">Logout</button>
      </div>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
      <Link onClick={closeMenu} href="/auth/login" className="rounded-xl border border-forest py-3 text-center text-sm font-semibold text-forest">Log in</Link>
      <Link onClick={closeMenu} href="/auth/signup" className="rounded-xl bg-forest py-3 text-center text-sm font-semibold text-white">Sign up</Link>
    </div>
  );
}