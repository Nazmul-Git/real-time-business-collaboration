import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import mongoose from 'mongoose';
import Room from '@/app/models/Room';
import Message from '@/app/models/Message';

export async function GET(request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const roomId = url.pathname.split('/').pop();

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }

    const room = await Room.findById(roomId)
      .populate({
        path: 'messages',
        options: { sort: { timestamp: 1 } },
      })
      .lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ messages: room.messages || [] });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const roomId = url.pathname.split('/').pop();

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }

    const { sender, content, receiver } = await request.json();

    if (!sender || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 chars)' }, { status: 400 });
    }

    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const roomDoc = await Room.findById(roomId).session(session);
      if (!roomDoc) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const newMessageData = {
        sender,
        content,
        room: roomId,
        timestamp: new Date(),
        read: false,
      };

      if (receiver) {
        newMessageData.receiver = receiver;
      }

      const newMessage = new Message(newMessageData);

      await newMessage.save({ session });

      roomDoc.messages.push(newMessage._id);
      roomDoc.lastActivity = new Date();
      await roomDoc.save({ session });

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: {
          _id: newMessage._id,
          sender: newMessage.sender,
          receiver: newMessage.receiver,
          content: newMessage.content,
          room: newMessage.room,
          timestamp: newMessage.timestamp,
          read: newMessage.read,
        },
      }, { status: 201 });

    } catch (err) {
      await session.abortTransaction();
      console.error('Transaction error:', err);
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error in POST /api/join-room/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', ...(process.env.NODE_ENV === 'development' && { details: error.message }) },
      { status: 500 }
    );
  }
}

