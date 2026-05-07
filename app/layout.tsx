import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, Poppins } from "next/font/google";
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

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} ${poppins.variable} antialiased`}
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
