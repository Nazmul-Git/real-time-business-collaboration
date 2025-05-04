import { NextResponse } from 'next/server';

export async function GET() {
  // This route is just for Next.js to establish the socket.io connection
  // Actual socket.io setup happens in middleware
  return NextResponse.json({ success: true, message: 'Socket endpoint' });
}