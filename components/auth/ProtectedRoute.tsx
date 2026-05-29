"use client";
import { Logo } from "@/components/ui/Logo";

import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "customer" | "staff" | "admin";
}

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-swansons-cream">
    <Logo width={120} height={60} />
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-swansons-green border-t-transparent animate-spin" />
      <p className="font-body text-swansons-muted text-sm">Loading...</p>
    </div>
  </div>
);

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = [
    "/",
    "/signin",
    "/unauthorized",
    "/terms",
    "/onboarding",
  ];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (isPublicPath) return;

    if (!loading && !user) {
      const returnTo = window.location.pathname + window.location.search;
      router.push(`/signin?returnTo=${encodeURIComponent(returnTo)}`);
    }

    if (
      !loading &&
      user &&
      (!("termsAcceptedAt" in user) || !user.termsAcceptedAt)
    ) {
      if (pathname !== "/terms") {
        router.replace("/terms");
      }
      return;
    }

    if (!loading && user && user.termsAcceptedAt && pathname === "/terms") {
      router.replace("/dashboard");
      return;
    }

    if (
      !loading &&
      user &&
      (!user.displayName || user.displayName.trim() === "") &&
      user.providerData?.[0]?.providerId !== "google.com"
    ) {
      if (pathname !== "/onboarding") {
        router.replace("/onboarding");
      }
      return;
    }

    if (!loading && user && user.displayName && pathname === "/onboarding") {
      router.replace("/dashboard");
      return;
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
  }, [user, loading, router, isPublicPath, requiredRole, role, pathname]);

  if (isPublicPath) return <>{children}</>;

  if (loading) return <LoadingScreen />;

  if (!user) return <LoadingScreen />;

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
