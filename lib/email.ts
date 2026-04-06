import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendReminderEmail(
  to: string,
  medicationName: string,
  time: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/reminder/${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_USER || "noreply@medication-tracker.local",
    to,
    subject: `Reminder: ${medicationName} at ${time}`,
    text: `Hi,\n\nThis is your reminder to take ${medicationName} (scheduled at ${time}).\n\nPlease complete your daily check-in:\n${link}\n\nThank you.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1AA1E3;">Medication Reminder</h2>
        <p>This is your reminder to take <strong>${medicationName}</strong> (scheduled at ${time}).</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #1AA1E3; color: white; text-decoration: none; border-radius: 6px; margin-top: 12px;">
          Complete Check-In
        </a>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">Or copy this link: ${link}</p>
      </div>
    `,
  });
}
