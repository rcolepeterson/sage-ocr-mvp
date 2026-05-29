"use client";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  getUser,
  AppUser,
  updateUserTermsAccepted,
} from "@/lib/firebase/users";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useContext, Suspense } from "react";

function TermsContent() {
  const { user } = useAuth();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "true"; // ← add this
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preview) return; // ← skip redirect in preview mode
    if (user && user.termsAcceptedAt) {
      router.replace("/dashboard");
    }
  }, [user, router, preview]);

  const handleAgree = async () => {
    if (preview) {
      router.back();
      return;
    } // ← in preview just go back
    if (!user) return;
    setSubmitting(true);
    await updateUserTermsAccepted(user.uid);
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
      {preview && (
        <p className="text-xs text-orange-400 font-medium uppercase tracking-wide mb-4">
          Preview mode — changes not saved
        </p>
      )}
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
          {submitting ? "Saving..." : preview ? "← Back (preview)" : "I Agree"}
        </Button>
      </div>
    </main>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={null}>
      <TermsContent />
    </Suspense>
  );
}
