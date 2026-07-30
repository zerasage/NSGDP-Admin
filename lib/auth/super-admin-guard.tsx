"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Admin portal is shared by two principal types: super_admin (full access)
// and staff (capability entirely from their permission group). Neither has
// any business outside this app, but both belong inside it.
function isAdminPortalRole(role: string | undefined): boolean {
  return role === "super_admin" || role === "staff";
}

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdminPortalRole(user?.role)) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdminPortalRole(user?.role)) {
    return null;
  }

  return <>{children}</>;
}
