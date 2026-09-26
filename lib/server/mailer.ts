import 'server-only';
import nodemailer from 'nodemailer';

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('GMAIL_USER / GMAIL_APP_PASSWORD are not set');
  }
}

let transport: nodemailer.Transporter | null = null;

function mailer(): nodemailer.Transporter {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''); // Google shows it as "abcd efgh ..."
  if (!user || !pass) throw new EmailNotConfiguredError();
  transport ??= nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  return transport;
}

export async function sendVerificationCode(to: string, name: string, code: string): Promise<void> {
  await mailer().sendMail({
    from: `RoomWise <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your RoomWise code: ${code}`,
    text: `Hi ${name},\n\nYour RoomWise sign-in code is ${code}.\nIt expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Your RoomWise sign-in code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you didn't ask for this, you can ignore this email.</p>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
