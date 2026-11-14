// backend/src/lib/mail.ts
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtppro.zoho.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    throw new Error('SMTP credentials (SMTP_USER and SMTP_PASS) are not configured in environment variables');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection successfully established and verified!' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to verify SMTP connection' };
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. If RESEND_API_KEY is configured, send via HTTP API (Port 443 - never blocked on Render Free tier)
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    const from = process.env.SMTP_FROM || 'eBay Flow <onboarding@resend.dev>';
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
    });

    if (error) {
      throw new Error(error.message || 'Failed to send email via Resend API');
    }
    return data;
  }

  // 2. Traditional SMTP fallback
  const transporter = getMailTransporter();
  const defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from: defaultFrom,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}

