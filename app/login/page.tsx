// app/login/page.tsx (or wherever this file lives)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <span className="text-4xl mb-2 block">🌿</span>
          <h1 className="text-2xl mb-1">Sage</h1>
          <p className="text-swansons-muted text-sm">Swansons Nursery</p>
        </div>

        {/* Password Input */}
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mb-4"
          autoFocus
        />

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Submit Button */}
        <Button type="submit" variant="primary" className="w-full">
          Enter
        </Button>
      </form>
    </main>
  );
}
