/* eslint-disable @typescript-eslint/no-explicit-any */
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

if (typeof window !== "undefined") {
  if (process.env.NODE_ENV === "development") {
    // Use the exact registered debug token
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
      "0f545190-3605-4320-aa15-f59fd47d1cfa";
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(
        process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY!,
      ),
      isTokenAutoRefreshEnabled: true,
    });
    console.log(
      "✅ App Check initialized with site key:",
      process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY,
    );
  } catch (e) {
    console.error("❌ App Check initialization failed:", e);
  }
}

export default app;
