// app/api/rooms/public/route.js

import { NextResponse } from 'next/server';
import Room from '@/app/models/Room';
import connectDB from '@/app/lib/dbConnect';

const handleError = (error, status = 500) => {
  console.error(error);
  return NextResponse.json({ error: error.message || 'Server error' }, { status });
};

export async function GET(request) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;

    let query = { isPrivate: false };

    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: 'i' };
    }

    const rooms = await Room.find(query)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Room.countDocuments(query);

    return NextResponse.json({
      rooms,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    return handleError(error);
  }
}
