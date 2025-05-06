import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/app/lib/dbConnect';
import Message from '@/app/models/Message';

// Helper function to validate IDs
const validateIds = (...ids) => {
  return ids.every(id => mongoose.Types.ObjectId.isValid(id));
};

// POST - Send a new message
export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Request body is required' },
        { status: 400 }
      );
    }

    const { sender, receiver, content } = body;

    // Validate required fields
    if (!sender || !receiver || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields (sender, receiver, content)' },
        { status: 400 }
      );
    }

    // Validate content length
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!validateIds(sender, receiver)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const newMessage = new Message({
      sender: new mongoose.Types.ObjectId(sender),
      receiver: new mongoose.Types.ObjectId(receiver),
      content: content.trim(),
      status: 'sent',
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();

    // Format the response
    const responseData = {
      _id: savedMessage._id.toString(),
      sender: savedMessage.sender.toString(),
      receiver: savedMessage.receiver.toString(),
      content: savedMessage.content,
      status: savedMessage.status,
      timestamp: savedMessage.timestamp.toISOString()
    };

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully',
        data: responseData
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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

    // Validate required parameters
    if (!userId || !contactId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters (userId, contactId)' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!validateIds(userId, contactId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: contactId },
        { sender: contactId, receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .lean();

    // Format the response data
    const formattedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      sender: msg.sender.toString(),
      receiver: msg.receiver.toString(),
      content: msg.content,
      status: msg.status,
      timestamp: msg.timestamp.toISOString()
    }));

    return NextResponse.json(
      { 
        success: true, 
        data: formattedMessages,
        count: formattedMessages.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch messages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update message status
export async function PUT(request) {
  await dbConnect();

  try {
    const body = await request.json();
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Request body is required' },
        { status: 400 }
      );
    }

    const { messageIds, status } = body;

    // Validate required fields
    if (!messageIds || !Array.isArray(messageIds) || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields (messageIds, status)' },
        { status: 400 }
      );
    }

    // Validate message IDs
    if (messageIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'messageIds array cannot be empty' },
        { status: 400 }
      );
    }

    const invalidIds = messageIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid message ID format',
          invalidIds
        },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['sent', 'delivered', 'read'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid status value',
          validStatuses
        },
        { status: 400 }
      );
    }

    // Update messages
    const result = await Message.updateMany(
      { _id: { $in: messageIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { 
        $set: { 
          status,
          updatedAt: new Date() 
        } 
      }
    );

    // Check if any documents were modified
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No messages were updated',
          data: result
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Messages updated successfully',
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update messages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}