"use client";

import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-swansons-cream px-4">
      <div className="card p-8 w-full max-w-md text-center">
        <span className="text-5xl mb-3 block">🌿</span>
        <h1 className="text-2xl mb-1">Welcome to Sage</h1>
        <p className="text-swansons-muted mb-8">Swansons Nursery Plant Care</p>
        <button
          onClick={signInWithGoogle}
          className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
