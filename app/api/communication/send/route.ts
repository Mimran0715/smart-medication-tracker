import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { providerEmail, message, includeStats } = body;

  // TEMP: replace with your teammate's email system
  console.log("Sending email to:", providerEmail);
  console.log("Message:", message);
  console.log("Include stats:", includeStats);

  // later: plug in nodemailer / resend / sendgrid

  return NextResponse.json({ success: true });
}