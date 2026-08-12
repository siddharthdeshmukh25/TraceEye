"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "../../components/dashboard";
import LoadingPage from "../../components/loading-page";
import { isAuthenticated, migrateOldSession } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    // Try to migrate old session first
    const migrated = migrateOldSession();
    
    // Check if user is authenticated using new token system
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }
    setAuthorized(true);
  }, [router]);
  
  if (!authorized) return <LoadingPage />;
  return <Dashboard />;
}
