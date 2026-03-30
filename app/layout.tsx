import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNav from "@/components/nav/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sage",
  description: "Swansons Nursery Plant Care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Exclude /signin from protection to avoid redirect loop
  const isSignInPage =
    typeof window !== "undefined" && window.location.pathname === "/signin";
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {isSignInPage ? (
            children
          ) : (
            <ProtectedRoute>{children}</ProtectedRoute>
          )}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
