"use client";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/Logo";

const STORAGE_KEY = "sage_access";
const CODE = "herd";

export function InviteGate({ children }: { children: React.ReactNode }) {
  const [passed, setPassed] = useState(true); // default true avoids flash
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setPassed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toLowerCase().trim() === CODE) {
      localStorage.setItem(STORAGE_KEY, "true");
      setPassed(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    }
  };

  if (passed) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-swansons-cream flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 max-w-xs w-full">
        <Logo width={140} height={70} />
        <p className="font-body text-swansons-muted text-sm text-center">
          Enter your invite code to continue.
        </p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            className="input w-full text-center font-body tracking-widest"
            type="password"
            placeholder="••••"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          {error && (
            <p className="font-body text-xs text-red-500 text-center">
              Incorrect code. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-swansons-navy text-white font-body font-semibold py-3 rounded-full hover:opacity-90 transition"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
