import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/app/lib/dbConnect';
import Message from '@/app/models/Message';

// POST - Send a new message
export async function POST(request) {
  await dbConnect();

  try {
    const { sender, receiver, content } = await request.json();

    if (!sender || !receiver || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newMessage = new Message({
      sender: new mongoose.Types.ObjectId(sender),
      receiver: new mongoose.Types.ObjectId(receiver),
      content,
      status: 'sent'
    });

    await newMessage.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully',
        data: {
          ...newMessage.toObject(),
          _id: newMessage._id.toString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch conversation between two users
export async function GET(request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contactId = searchParams.get('contactId');

    if (!userId || !contactId) {
      return NextResponse.json(
        { success: false, message: 'Missing user IDs' },
        { status: 400 }
      );
    }

    const messages = await Message.find({
      $or: [
        { sender: new mongoose.Types.ObjectId(userId), receiver: new mongoose.Types.ObjectId(contactId) },
        { sender: new mongoose.Types.ObjectId(contactId), receiver: new mongoose.Types.ObjectId(userId) }
      ]
    })
    .sort({ timestamp: 1 })
    .lean();

    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      sender: msg.sender.toString(),
      receiver: msg.receiver.toString()
    }));

    return NextResponse.json(
      { success: true, data: formattedMessages },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update message status
export async function PUT(request) {
  await dbConnect();

  try {
    const { messageIds, status } = await request.json();

    if (!messageIds || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { status } }
    );

    return NextResponse.json(
      { success: true, message: 'Messages updated successfully', data: result },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update messages', error: error.message },
      { status: 500 }
    );
  }
}
