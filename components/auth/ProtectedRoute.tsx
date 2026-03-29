"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "customer" | "staff" | "admin";
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ["/signin"];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.push("/signin");
    }
    if (
      !loading &&
      user &&
      requiredRole &&
      role &&
      !(
        (requiredRole === "staff" && (role === "staff" || role === "admin")) ||
        (requiredRole === "admin" && role === "admin") ||
        (requiredRole === "customer" && role === "customer")
      )
    ) {
      router.push("/unauthorized");
    }
  }, [user, loading, router, isPublicPath, requiredRole, role]);

  if (isPublicPath) return <>{children}</>;

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!user) return null;

  if (requiredRole && role) {
    if (
      (requiredRole === "staff" && (role === "staff" || role === "admin")) ||
      (requiredRole === "admin" && role === "admin") ||
      (requiredRole === "customer" && role === "customer")
    ) {
      return <>{children}</>;
    } else {
      return null;
    }
  }

  return <>{children}</>;
}
