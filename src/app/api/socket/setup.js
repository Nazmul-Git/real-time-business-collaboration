import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is just for initialization - actual setup happens in middleware
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}