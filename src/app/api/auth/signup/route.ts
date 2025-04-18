import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import bcrypt from "bcrypt";
import { signupSchema } from "../../../../typs/auth";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fname, lname } = signupSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user with is_active=false
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name: fname,
        last_name: lname,
        created_by: email,
        modified_by: email,
        login_ts: new Date(),
        is_active: false, // User is not active until verified
        verification_token: verificationToken, // Store token
      },
    });

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"ASK DB" <${process.env.EMAIL_USER}>`, // Sender name added
      to: email,
      subject: "Verify Your Email - ASK DB",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333;">Email Verification Required</h2>
          <p>Hello,</p>
          <p>Thank you for signing up with <strong>ASK DB</strong>. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </p>
          <p>This link will expire in <strong>24 hours</strong>. If you did not sign up, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #777;">Best Regards,<br><strong>ASK DB Team</strong></p>
        </div>
      `,
    });

    return NextResponse.json({ message: "User created. Verification email sent!" });
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
