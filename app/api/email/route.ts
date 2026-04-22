import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    // Dynamically import Resend to keep server-only
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
