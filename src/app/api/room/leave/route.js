// app/api/rooms/leave/route.js

import { NextResponse } from 'next/server';
import Room from '@/app/models/Room';
import User from '@/app/models/User';
import connectDB from '@/app/lib/dbConnect';

const handleError = (error, status = 500) => {
  console.error(error);
  return NextResponse.json({ error: error.message || 'Server error' }, { status });
};

const validateUser = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId);
  return !!user;
};

export async function POST(request) {
  try {
    await connectDB();

    const { roomId, userId } = await request.json();

    if (!roomId || !userId) {
      return handleError(new Error('Room ID and user ID are required'), 400);
    }

    if (!(await validateUser(userId))) {
      return handleError(new Error('User not found'), 404);
    }

    const room = await Room.findById(roomId);
    if (!room) return handleError(new Error('Room not found'), 404);

    if (!room.members.includes(userId)) {
      return handleError(new Error('User is not a member of the room'), 400);
    }

    room.members = room.members.filter(member => member.toString() !== userId);
    await room.save();

    return NextResponse.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    return handleError(error);
  }
}
