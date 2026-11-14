// backend/src/lib/mail.ts
import nodemailer from 'nodemailer';

export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.zoho.com';
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

