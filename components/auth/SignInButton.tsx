"use client";

import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

export default function SignInButton() {
  const [user, loading] = useAuthState(auth);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) return <p className="text-center">Loading...</p>;

  if (user)
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-swansons-muted">Welcome {user.displayName}</p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-full border border-swansons-muted px-6 py-2 text-swansons-muted hover:bg-gray-100 transition"
        >
          Sign Out
        </button>
      </div>
    );

  return (
    <div className="flex justify-center">
      <button
        onClick={signInWithGoogle}
        className="w-full rounded-full bg-green-700 text-white px-6 py-2 hover:bg-green-800 transition"
      >
        Sign in with Google
      </button>
    </div>
  );
}
