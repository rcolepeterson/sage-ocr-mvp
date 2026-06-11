/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/broadcast
 * Admin-only. Sends a broadcast notification to all matching users.
 * Filters by plantTags (OR logic) or sends to all users if sendToAll is true.
 * Writes one /notifications doc per recipient + one /broadcasts record.
 * Sends emails using Resend Batch API (max 100 per call) to avoid rate limiting.
 *
 * Body: {
 *   title: string
 *   body: string
 *   tags: string[]       // ignored if sendToAll is true
 *   sendToAll: boolean
 *   sentBy: string       // admin uid
 *   sentByName: string   // admin displayName
 * }
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

    // ── 5. Query target users ────────────────────────────────────────────────
    let usersQuery;
    if (sendToAll) {
      usersQuery = adminDb.collection("users");
    } else {
      const queryTags = tags.slice(0, 30);
      if (tags.length > 30) {
        console.warn(`[broadcast] tag count (${tags.length}) truncated to 30`);
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

    // ── 6. Create broadcast record ───────────────────────────────────────────
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

    // ── 7. Write notifications in Firestore batches of 499 ───────────────────
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

    // ── 8. Send emails using Resend Batch API ────────────────────────────────
    // Resend batch API handles up to 100 emails per call — no rate limiting issues.
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailHtml = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#333;">
 <p style="font-size:15px;line-height:1.6;margin-bottom:24px;">${safeTitle}</p>
 <p style="margin-bottom:32px;">
   <a href="https://sagebyswansons.com/dashboard?notifications=open"
      style="background:#141f62;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;">
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
</div>`;

    // Build email list — skip users with no email address
    const emailList = userDocs
      .map((doc) => doc.data())
      .filter((userData) => !!userData.email)
      .map((userData) => ({
        from: "Sage by Swansons <hello@sagebyswansons.com>",
        to: userData.email as string,
        subject: "You received a new notification from Sage by Swansons",
        html: emailHtml,
      }));

    // Send in chunks of 100 (Resend batch limit per call)
    const EMAIL_BATCH_SIZE = 100;
    for (let i = 0; i < emailList.length; i += EMAIL_BATCH_SIZE) {
      const chunk = emailList.slice(i, i + EMAIL_BATCH_SIZE);
      await resend.batch.send(chunk);
      console.log(
        `[broadcast] emails sent: ${Math.min(i + EMAIL_BATCH_SIZE, emailList.length)}/${emailList.length}`,
      );
    }

    // ── 9. Mark broadcast as sent ─────────────────────────────────────────────
    await broadcastRef.update({ status: "sent" });

    console.log(
      `[broadcast] complete — ${recipientCount} notifications, ${emailList.length} emails, broadcastId: ${broadcastRef.id}`,
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
