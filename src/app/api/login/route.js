import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";
import nodemailer from "nodemailer";

async function sendOtpEmail(userEmail, otpCode) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Your OTP Code for Login",
    text: `Your OTP code is: ${otpCode}. This code is valid for 1 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req) {
  const { email, password } = await req.json();

  try {
    await dbConnect();
    const user = await User.findOne({ email });

    if (!user) {
      return Response.json({ message: "Invalid email or password" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return Response.json({ message: "Invalid email or password" }, { status: 400 });
    }

    // Check if token is expired — reset 2FA
    if (user.tokenExpires && user.tokenExpires < new Date()) {
      user.twoFactorEnabled = false;
      await user.save();
    }

    // If 2FA is not yet enabled or reset, send OTP
    if (!user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000);
      const otpExpires = Date.now() + 1 * 60 * 1000; // 1 minute validity

      user.otpCode = otpCode.toString();
      user.otpExpires = otpExpires;
      await user.save();
      await sendOtpEmail(user.email, otpCode);

      return Response.json({ twoFactorEnabled: true, message: "OTP sent to your email" }, { status: 200 });
    }

    // Generate JWT if 2FA already passed
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

    // Save token expiry
    user.tokenExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    await user.save();

    return Response.json({ message: "Login successful", token, role: user.role }, { status: 200 });

  } catch (error) {
    console.error("Error during login:", error);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
