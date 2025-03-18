import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    console.log("Received OTP Verification Request:", { email, otp });

    await dbConnect(); // Ensure DB connection
    const user = await User.findOne({ email });

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 400 });
    }

    if (!user.twoFactorEnabled) {
      return new Response(JSON.stringify({ message: "2FA is not enabled" }), { status: 400 });
    }

    // ✅ Check If OTP Exists and Is Not Expired
    if (!user.otpCode || Date.now() > new Date(user.otpExpires).getTime()) {
      return new Response(JSON.stringify({ message: "OTP expired" }), { status: 400 });
    }

    // ✅ Verify OTP Code
    if (user.otpCode !== otp) {
      return new Response(JSON.stringify({ message: "Invalid OTP" }), { status: 400 });
    }

    // ✅ Generate JWT After OTP is Verified
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // ✅ Clear OTP Fields After Successful Verification (Security Best Practice)
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
