// backend/src/lib/mail.ts
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.zoho.com';
const port = Number(process.env.SMTP_PORT) || 465;
const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const defaultFrom = process.env.SMTP_FROM || user;

export function getMailTransporter() {
  if (!user || !pass) {
    throw new Error('SMTP credentials (SMTP_USER and SMTP_PASS) are not configured in environment variables');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
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

  return transporter.sendMail({
    from: defaultFrom,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}

