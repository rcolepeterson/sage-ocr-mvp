"use client";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getUser } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateUserTermsAccepted } from "@/lib/firebase/users";

import { useContext } from "react";
import { AuthContext } from "@/lib/firebase/AuthContext";

export default function TermsPage() {
  const { user } = useAuth();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If already accepted, redirect home
    if (user && (user as any).termsAcceptedAt) {
      router.replace("/");
    }
  }, [user, router]);

  const handleAgree = async () => {
    if (!user) return;
    setSubmitting(true);
    await updateUserTermsAccepted(user.uid);
    // Re-fetch user doc and update AuthContext state
    const userDoc = await getUser(user.uid);
    if (
      userDoc &&
      authCtx &&
      typeof authCtx === "object" &&
      "setUser" in authCtx
    ) {
      // @ts-ignore
      authCtx.setUser({
        ...user,
        termsAcceptedAt: userDoc.termsAcceptedAt,
        termsVersion: userDoc.termsVersion,
      });
    }
    setSubmitting(false);
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-swansons-cream px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Terms & Conditions
        </h1>
        <div className="prose prose-sm max-w-none mb-6 text-gray-700">
          <p>
            Welcome to Sage! Please read and accept our Terms & Conditions to
            continue using the app.
          </p>
          <p>
            [Placeholder for full legal terms. Replace with actual content.]
          </p>
        </div>
        <button
          className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-800 transition disabled:opacity-50"
          onClick={handleAgree}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "I Agree"}
        </button>
      </div>
    </main>
  );
}
