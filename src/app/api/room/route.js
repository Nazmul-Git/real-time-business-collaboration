import dbConnect from '@/app/lib/dbConnect';
import Room from '@/app/models/Room';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // Get all rooms (both public and private)
    const rooms = await Room.find({})
    // console.log(rooms)

    return NextResponse.json(rooms);

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    const { name, isPrivate = false, password, creatorEmail } = await request.json();

    // Validate input
    if (!name || name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: 'Room name must be between 3-50 characters' },
        { status: 400 }
      );
    }

    if (isPrivate && (!password || password.length < 4)) {
      return NextResponse.json(
        { error: 'Private rooms require a password with at least 4 characters' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: creatorEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new room
    const newRoom = new Room({
      name,
      isPrivate,
      password: isPrivate ? password : undefined,
      createdBy: user._id,
      members: [user._id]
    });

    await newRoom.save();

    // Populate the room data for response
    const populatedRoom = await Room.findById(newRoom._id)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .lean();

    return NextResponse.json(populatedRoom, { status: 201 });

  } catch (error) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    );
  }
}