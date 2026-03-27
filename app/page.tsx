// app/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import SignInButton from "@/components/auth/SignInButton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen flex items-center justify-center bg-swansons-cream px-4">
        <div className="card p-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-5xl mb-3 block">🌿</span>
            <h1 className="text-2xl mb-1">Sage MVP</h1>
            <p className="text-swansons-muted">Choose a tool:</p>
          </div>

          {/* Sign In Button for testing */}
          <div className="my-8">
            <SignInButton />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/scan">
              <Button variant="primary" className="w-full">
                Scan Plant Tag (OCR)
              </Button>
            </Link>

            {/* Placeholder for future */}
            <Button disabled className="w-full">
              Dashboard (coming soon)
            </Button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
