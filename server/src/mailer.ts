import nodemailer from 'nodemailer';
import { config } from './config.js';

export const transporter = nodemailer.createTransport({
  host: config.etherealHost,
  port: config.etherealPort,
  secure: false,
  auth: {
    user: config.etherealUser,
    pass: config.etherealPass,
  },
});

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  await transporter.sendMail({
    from: config.emailFrom,
    to,
    subject,
    text: body,
  });
}
