import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    console.log("Received OTP Verification Request:", { email, otp });

    await dbConnect();
    const user = await User.findOne({ email });

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 400 });
    }

    if (!user.otpCode || Date.now() > new Date(user.otpExpires).getTime()) {
      return new Response(JSON.stringify({ message: "OTP expired or not found" }), { status: 400 });
    }

    if (user.otpCode !== otp) {
      return new Response(JSON.stringify({ message: "Invalid OTP" }), { status: 400 });
    }

    // ✅ OTP is valid — set twoFactorEnabled and issue JWT
    user.twoFactorEnabled = true;

    // 🔐 Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    // 💾 Save token expiration in DB (to reset 2FA later)
    user.tokenExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); 

    // 🧹 Clear OTP
    user.otpCode = null;
    user.otpExpires = null;

    await user.save();

    console.log("OTP Verified Successfully for:", email);
    return new Response(JSON.stringify({ message: "OTP verified", token }), { status: 200 });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    return new Response(JSON.stringify({ message: "Something went wrong" }), { status: 500 });
  }
}
