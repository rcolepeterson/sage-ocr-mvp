/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Dynamically import firebase-admin to avoid SSR issues
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const credentials = JSON.parse(
        process.env.FIREBASE_ADMIN_CREDENTIALS_JSON!,
      );
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id,
      });
    }

    const projectConfigManager = admin.auth().projectConfigManager();
    await projectConfigManager.updateProjectConfig({
      recaptchaConfig: {
        phoneEnforcementState: "OFF",
        useSmsTollFraudProtection: false,
        useSmsBotScore: false,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
