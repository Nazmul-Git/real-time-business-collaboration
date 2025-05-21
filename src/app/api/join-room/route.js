import dbConnect from '@/app/lib/dbConnect';
import Room from '@/app/models/Room';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { roomId } = params;

    // Validate roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    // Get room with populated messages, sorted by timestamp
    const room = await Room.findById(roomId)
      .populate({
        path: 'messages',
        options: { sort: { timestamp: 1 } } // Sort by timestamp ascending
      })
      .lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ messages: room.messages || [] });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}