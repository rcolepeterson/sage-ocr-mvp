"use client";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  getUser,
  AppUser,
  updateUserTermsAccepted,
} from "@/lib/firebase/users";
import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";

export default function TermsPage() {
  const { user } = useAuth();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If already accepted, redirect home
    if (user && user.termsAcceptedAt) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleAgree = async () => {
    if (!user) return;
    setSubmitting(true);
    await updateUserTermsAccepted(user.uid);
    // Re-fetch user doc and update AuthContext state
    const userDoc = await getUser(user.uid);
    if (userDoc && authCtx && typeof authCtx.setUser === "function") {
      authCtx.setUser({
        ...user,
        termsAcceptedAt: userDoc.termsAcceptedAt,
        termsVersion: userDoc.termsVersion,
      });
    }
    setSubmitting(false);
    router.replace("/dashboard");
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
        <Button
          className="w-full text-lg font-semibold"
          onClick={handleAgree}
          disabled={submitting}
          size="md"
          variant="primary"
        >
          {submitting ? "Saving..." : "I Agree"}
        </Button>
      </div>
    </main>
  );
}
