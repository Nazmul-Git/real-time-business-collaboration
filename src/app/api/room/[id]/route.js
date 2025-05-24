import dbConnect from '@/app/lib/dbConnect';
import Room from '@/app/models/Room';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Helper function to validate MongoDB ID
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) &&
    (new mongoose.Types.ObjectId(id)).toString() === id;
}

// Helper function to get populated room data
async function getPopulatedRoom(roomId) {
  if (!isValidObjectId(roomId)) {
    throw new Error('Invalid room ID format');
  }
  return await Room.findById(roomId)
    .select('-password')
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar')
    .lean();
}

// Middleware to validate request content type
function validateContentType(request) {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error('Invalid content type - expected application/json');
  }
}

// Middleware to parse and validate request body
async function parseRequestBody(request) {
  try {
    const requestClone = request.clone();
    const rawBody = await requestClone.text();

    if (!rawBody) {
      throw new Error('Request body is empty');
    }

    const parsedBody = JSON.parse(rawBody);
    return parsedBody;
  } catch (error) {
    console.error('Error parsing request body:', error);
    throw new Error('Invalid JSON format in request body');
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    console.log('id = ', id)

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Valid room ID is required' },
        { status: 400 }
      );
    }

    // Find room and populate members with essential user details
    const room = await Room.findById(id)
      .select('members') // Only fetch members field
      .populate({
        path: 'members',
        select: '_id name email avatar lastSeen status', // Select specific fields
        options: { sort: { name: 1 } } // Sort members alphabetically
      })
      .lean();

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Transform the response to focus on members
    const response = {
      roomId: id,
      memberCount: room.members.length,
      members: room.members.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        lastSeen: member.lastSeen,
        status: member.status || 'offline' // Default status if not set
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching room members:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch room members',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    // Validate content type
    validateContentType(request);

    // Parse request body
    const requestBody = await parseRequestBody(request);

    // Extract ID from URL and validate
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Valid room ID is required' },
        { status: 400 }
      );
    }

    const { userEmail, action, password } = requestBody;
    console.log(userEmail, action, password, id)

    // Validate input
    if (!userEmail || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail and action are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    switch (action.toLowerCase()) {
      case 'join':
        // Check if room is private and validate password
        if (room.isPrivate) {
          if (!password) {
            return NextResponse.json(
              { error: 'Password is required for private rooms' },
              { status: 401 }
            );
          }
          if (room.password !== password) {
            return NextResponse.json(
              { error: 'Incorrect password for private room' },
              { status: 401 }
            );
          }
        }

        // Add user to members array if not already present
        if (!room.members.some(memberId => memberId.equals(user._id))) {
          room.members.push(user._id);
          await room.save();
        }
        break;

      case 'leave':
        // Remove user from members array if present
        room.members = room.members.filter(
          memberId => !memberId.equals(user._id)
        );
        await room.save();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action - must be either "join" or "leave"' },
          { status: 400 }
        );
    }
    

    const updatedRoom = await getPopulatedRoom(id);
    return NextResponse.json({
      success: true,
      message: `User ${action.toLowerCase()}ed room successfully`,
      room: updatedRoom
    });

  } catch (error) {
    console.error('Error in room operation:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to perform room operation',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();

    // Validate content type
    validateContentType(request);

    // Parse request body
    const requestBody = await parseRequestBody(request);

    // Extract ID from URL and validate
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Valid room ID is required' },
        { status: 400 }
      );
    }

    const { userEmail } = requestBody;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (!room.createdBy.equals(user._id)) {
      return NextResponse.json(
        { error: 'Only room creator can delete the room' },
        { status: 403 }
      );
    }

    await Room.findByIdAndDelete(id);
    return NextResponse.json(
      {
        success: true,
        message: 'Room deleted successfully',
        deletedRoomId: id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete room',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}