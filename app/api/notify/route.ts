/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notify
 * Sends a push notification to a single FCM token via Firebase Admin SDK.
 * Body: { token: string, title: string, body: string }
 *
 * Uses FIREBASE_ADMIN_CREDENTIALS_JSON (sage-swansons-e4677 service account).
 * Do NOT use GOOGLE_APPLICATION_CREDENTIALS_JSON here.
 */
export async function POST(req: NextRequest) {
  // Destructure outside try so token is available in catch block
  const { token, title, body } = await req.json();
  try {
    if (
      !token ||
      typeof token !== "string" ||
      !title ||
      typeof title !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 },
      );
    }

    // Clamp lengths to prevent oversized payloads
    const safeTitle = String(title).slice(0, 100);
    const safeBody = String(body || "").slice(0, 500);

    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const credentials = JSON.parse(
        process.env.FIREBASE_ADMIN_CREDENTIALS_JSON!,
      );
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    }

    const messageId = await admin.messaging().send({
      token,
      notification: {
        title: safeTitle,
        body: safeBody,
      },
    });

    console.log("[notify] sent successfully, messageId:", messageId);
    return NextResponse.json({ success: true, messageId });
  } catch (err: any) {
    const code: string = err?.errorInfo?.code || err?.code || "";
    const isStale =
      code === "messaging/registration-token-not-registered" ||
      (err?.message || "").toLowerCase().includes("unregistered");

    if (isStale) {
      // Token is no longer valid — clear it from Firestore so it won't be
      // used again. The user will get a fresh token next time they load the app.
      console.warn(
        "[notify] stale token detected, clearing from Firestore:",
        token.slice(0, 20) + "...",
      );
      try {
        if (token) {
          const admin = await import("firebase-admin");
          const db = admin.firestore();
          const snap = await db
            .collection("users")
            .where("fcmToken", "==", token)
            .limit(1)
            .get();
          if (!snap.empty) {
            await snap.docs[0].ref.update({
              fcmToken: admin.firestore.FieldValue.delete(),
            });
            console.log("[notify] stale token cleared");
          }
        }
      } catch (clearErr: any) {
        console.error(
          "[notify] failed to clear stale token:",
          clearErr?.message,
        );
      }
      // Return success so the caller (threads.ts) doesn't log a noisy error
      return NextResponse.json({ success: true, stale: true });
    }

    console.error("[notify]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to send notification" },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
