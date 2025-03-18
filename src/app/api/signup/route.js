import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name, email, password } = await req.json();

  try {
    dbConnect();
    console.log('db connect ?')
    const existingUser = await User.findOne({ email });
    console.log(existingUser)
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
