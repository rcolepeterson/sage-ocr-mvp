import ClientLayout from "@/components/ClientLayout";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Raleway,
  Poppins,
  DM_Serif_Display,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
//import BottomNav from "@/components/nav/BottomNav";
import HamburgerMenu from "@/components/nav/HamburgerMenu";
import BackButton from "@/components/nav/BackButton";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: "400", // ← add this
});

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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} ${poppins.variable} ${dmSerifDisplay.variable}`}
    >
      <body className="antialiased">
        <AuthProvider>
          <div className="max-w-lg mx-auto min-h-screen bg-swansons-cream relative">
            <ClientLayout>
              <ProtectedRoute>{children}</ProtectedRoute>
            </ClientLayout>
            <HamburgerMenu />
            <BackButton />
            {/* <BottomNav /> */}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
