import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';
import { withRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function handler(request: Request) {
  if (request.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { name, email, company, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'Name, email, and message are required fields.' },
        { status: 400 }
      );
    }

    const recipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER;

    if (!recipient) {
      return NextResponse.json(
        { message: 'Mail server recipient is not configured.' },
        { status: 500 }
      );
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">New Contact Form Message</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>From:</strong></td>
            <td style="padding: 8px 0; color: #0f172a;">${name} (${email})</td>
          </tr>
          ${company ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Company:</strong></td><td style="padding: 8px 0; color: #0f172a;">${company}</td></tr>` : ''}
          ${subject ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Subject:</strong></td><td style="padding: 8px 0; color: #0f172a;">${subject}</td></tr>` : ''}
        </table>
        <div style="padding: 16px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.6; white-space: pre-wrap;">${message}</div>
      </div>
    `;

    await sendEmail({
      to: recipient,
      subject: `[Contact Form] ${subject || 'New Message from ' + name}`,
      html: emailHtml,
      text: `From: ${name} (${email})\nCompany: ${company || 'N/A'}\nSubject: ${subject || 'N/A'}\n\nMessage:\n${message}`,
      replyTo: email,
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully!' });
  } catch (error: any) {
    console.error('[Contact Form Error]:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handler, { windowMs: 60000, max: 10 });

