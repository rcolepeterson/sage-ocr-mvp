/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/broadcast
 * Admin-only. Sends a broadcast notification to all matching customers.
 * Filters by plantTags (OR logic) or sends to all customers if sendToAll is true.
 * Writes one /notifications doc per recipient + one /broadcasts record.
 *
 * Body: {
 *   title: string
 *   body: string
 *   tags: string[]       // ignored if sendToAll is true
 *   sendToAll: boolean
 *   sentBy: string       // admin uid
 *   sentByName: string   // admin displayName
 * }
 *
 * Uses FIREBASE_ADMIN_CREDENTIALS_JSON (sage-swansons-e4677 Firebase Admin SDK).
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify auth token ─────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];

    // ── 2. Init Firebase Admin ───────────────────────────────────────────────
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const credentials = JSON.parse(
        process.env.FIREBASE_ADMIN_CREDENTIALS_JSON!,
      );
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    }

    // ── 3. Verify caller is an admin ─────────────────────────────────────────
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = admin.firestore();
    const callerSnap = await adminDb.collection("users").doc(decoded.uid).get();

    if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 4. Parse + validate body ─────────────────────────────────────────────
    const {
      title,
      body,
      tags,
      sendToAll,
      sentBy,
      sentByName,
      ctaUrl,
      ctaLabel,
    } = await req.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body || typeof body !== "string") {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }
    if (!sendToAll && (!Array.isArray(tags) || tags.length === 0)) {
      return NextResponse.json(
        { error: "Select at least one tag or enable Send to all" },
        { status: 400 },
      );
    }

    const safeTitle = title.slice(0, 50);
    const safeBody = body.slice(0, 160);

    // ── 5. Query target customers ────────────────────────────────────────────
    // All users receive broadcasts regardless of role
    let usersQuery;

    if (sendToAll) {
      usersQuery = adminDb.collection("users");
    } else {
      // array-contains-any = OR logic across tags (Firestore limit: 30)
      const queryTags = tags.slice(0, 30);
      if (tags.length > 30) {
        console.warn(
          `[broadcast] tag count (${tags.length}) exceeds Firestore limit of 30 — truncated`,
        );
      }
      usersQuery = adminDb
        .collection("users")
        .where("plantTags", "array-contains-any", queryTags);
    }

    const usersSnap = await usersQuery.get();
    const recipientCount = usersSnap.docs.length;

    if (recipientCount === 0) {
      return NextResponse.json(
        { error: "No users match the selected tags" },
        { status: 400 },
      );
    }

    // ── 6. Create broadcast record (status: "sending") ───────────────────────
    const broadcastRef = adminDb.collection("broadcasts").doc();
    await broadcastRef.set({
      title: safeTitle,
      body: safeBody,
      tags: sendToAll ? [] : tags,
      sendToAll: !!sendToAll,
      recipientCount,
      sentBy,
      sentByName,
      status: "sending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(ctaUrl ? { ctaUrl: String(ctaUrl).slice(0, 500) } : {}),
      ...(ctaLabel ? { ctaLabel: String(ctaLabel).slice(0, 35) } : {}),
    });

    // ── 7. Write notifications in batches of 499 ─────────────────────────────
    // Firestore batch limit is 500 ops — using 499 to leave room for broadcast update
    const BATCH_SIZE = 499;
    const userDocs = usersSnap.docs;

    for (let i = 0; i < userDocs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = userDocs.slice(i, i + BATCH_SIZE);

      chunk.forEach((userDoc) => {
        const notifRef = adminDb.collection("notifications").doc();
        batch.set(notifRef, {
          userId: userDoc.id,
          title: safeTitle,
          body: safeBody,
          type: "broadcast",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          broadcastId: broadcastRef.id,
          ...(ctaUrl ? { ctaUrl: String(ctaUrl).slice(0, 500) } : {}),
          ...(ctaLabel ? { ctaLabel: String(ctaLabel).slice(0, 35) } : {}),
        });
      });

      await batch.commit();
    }

    // ── 8. Send emails to each recipient ─────────────────────────────────────
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailHtml = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#333;">
  <p style="font-size:15px;line-height:1.6;margin-bottom:24px;">${safeTitle}</p>
  <p style="margin-bottom:32px;">
    <a href="https://sagebyswansons.com/dashboard?notifications=open" style="background:#141f62;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;">
      View notification →
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin-bottom:24px;" />
  <p style="font-size:12px;color:#999;line-height:1.6;margin-bottom:8px;">
    You're receiving expert advice, seasonal plant tips and offers from Sage.
  </p>
  <p style="font-size:12px;color:#999;margin-bottom:8px;">
    <a href="https://sagebyswansons.com/unsubscribe" style="color:#999;">Unsubscribe</a>
  </p>
  <p style="font-size:12px;color:#999;">
    Swansons Nursery · 9701 15th Ave NW, Seattle, WA 98117
  </p>
</div>
`;

    const emailPromises = usersSnap.docs.map((userDoc) => {
      const userData = userDoc.data();
      if (!userData.email) return Promise.resolve();
      return resend.emails
        .send({
          from: "Sage by Swansons <hello@sagebyswansons.com>",
          to: userData.email,
          subject: safeTitle,
          html: emailHtml,
        })
        .catch((err) =>
          console.warn(
            "[broadcast] email failed for",
            userData.email,
            err?.message,
          ),
        );
    });

    await Promise.all(emailPromises);

    // ── 9. Mark broadcast as sent ─────────────────────────────────────────────
    await broadcastRef.update({ status: "sent" });

    console.log(
      `[broadcast] sent to ${recipientCount} users, broadcastId: ${broadcastRef.id}`,
    );

    return NextResponse.json({
      success: true,
      recipientCount,
      broadcastId: broadcastRef.id,
    });
  } catch (err: any) {
    console.error("[broadcast]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to send broadcast" },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
