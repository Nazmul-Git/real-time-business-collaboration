import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    twoFactorEnabled: { 
      type: Boolean,
      default: false, 
    },
    twoFactorSecret: {
      type: String, 
    },
    otpCode: {
      type: String, 
    },
    otpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.users || mongoose.model("users", UserSchema);
export default User;
