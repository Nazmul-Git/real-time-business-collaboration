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
    text: `Your OTP code is: ${otpCode}. This code is valid for 10 minutes.`,
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

    // Enforce Two-Factor Authentication 
    if (!user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000);
      const otpExpires = Date.now() + 10 * 60 * 1000; 

      // Store OTP and expiration time in the database
      user.otpCode = otpCode.toString();
      user.otpExpires = otpExpires;
      await user.save();
      await sendOtpEmail(user.email, otpCode);

      return Response.json({ twoFactorEnabled: true, message: "OTP sent to your email" }, { status: 200 });
    }

    // Generate JWT Only If 2FA is Not Required
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const role = user.role;
    // console.log(role)

    return Response.json({ message: "Login successful", token, role }, { status: 200 });
  } catch (error) {
    console.error("Error during login:", error);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}