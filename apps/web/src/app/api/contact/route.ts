import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { logError } from '@stpetemusic/db';

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'Email service not configured.' }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  const body = await req.json().catch(() => null);

  const name: unknown = body?.name;
  const email: unknown = body?.email;
  const subject: unknown = body?.subject;
  const message: unknown = body?.message;
  const website: unknown = body?.website; // honeypot

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ message: 'Name is required.' }, { status: 400 });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ message: 'Valid email is required.' }, { status: 400 });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ message: 'Message is required.' }, { status: 400 });
  }

  // Honeypot: silently fail if honeypot is filled
  if (website && typeof website === 'string' && website.length > 0) {
    return NextResponse.json({ message: 'Message sent.' }, { status: 200 });
  }

  const subjectLine = subject && typeof subject === 'string' && subject.trim().length > 0
    ? `[StPeteMusic - Contact Form] ${subject.trim()}`
    : '[StPeteMusic - Contact Form] No Subject';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await resend.emails.send({
      from: 'hello@stpetemusic.live',
      to: 'theburgmusic@gmail.com',
      replyTo: email.trim(),
      subject: subjectLine,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #FF8C00; margin-bottom: 1rem;">New Contact Form Submission</h2>

          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="margin: 0 0 1rem 0;"><strong>From:</strong> ${escapeHtml(name.trim())}</p>
            <p style="margin: 0 0 1rem 0;"><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${escapeHtml(subject && typeof subject === 'string' ? subject.trim() : '(no subject)')}</p>
          </div>

          <div style="margin-bottom: 2rem; line-height: 1.6;">
            <p style="margin: 0 0 1rem 0;"><strong>Message:</strong></p>
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message.trim())}</p>
          </div>

          <div style="border-top: 1px solid #ddd; padding-top: 1rem; font-size: 12px; color: #999;">
            <p style="margin: 0;">This message was sent via the StPeteMusic contact form.</p>
          </div>
        </div>
      `,
    });

    if (!res.error) {
      return NextResponse.json({ message: 'Message sent successfully.' }, { status: 200 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logError({
      app: 'web',
      status_code: 500,
      path: '/api/contact',
      method: 'POST',
      message: `[contact] Resend error: ${msg}`,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ message: 'Failed to send message. Please try again.' }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json({ message: 'Failed to send message. Please try again.' }, { status: 500 });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
