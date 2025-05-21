import { NextResponse } from 'next/server';
import Room from '@/app/models/Room';
import Message from '@/app/models/Message';
import dbConnect from '@/app/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await dbConnect();
        const url = new URL(request.url);
        const roomId = url.pathname.split('/').pop();

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

export async function POST(request) {
    try {
        // Extract ID from URL pathname using the suggested method
        const url = new URL(request.url);
        const roomId = url.pathname.split('/').pop();

        // Validate roomId
        if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
            return NextResponse.json(
                { error: 'Invalid room ID' },
                { status: 400 }
            );
        }

        // Parse request body
        const { userId, userName, text } = await request.json();

        // Validate required fields
        if (!userId || !userName || !text) {
            return NextResponse.json(
                { error: 'Missing required fields (userId, userName, or text)' },
                { status: 400 }
            );
        }

        // Validate text length
        if (text.length > 1000) {
            return NextResponse.json(
                { error: 'Message too long (max 1000 characters)' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verify room exists and lock it for update
            const room = await Room.findById(roomId).session(session);
            if (!room) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'Room not found' },
                    { status: 404 }
                );
            }

            // Create and save message
            const newMessage = new Message({
                roomId,
                userId,
                userName,
                text,
                timestamp: new Date()
            });

            await newMessage.save({ session });

            // Update room's messages array and last activity
            room.messages.push(newMessage._id);
            room.lastActivity = new Date();
            await room.save({ session });

            // Commit the transaction
            await session.commitTransaction();

            return NextResponse.json(
                {
                    success: true,
                    message: {
                        id: newMessage._id,
                        roomId: newMessage.roomId,
                        userId: newMessage.userId,
                        userName: newMessage.userName,
                        text: newMessage.text,
                        timestamp: newMessage.timestamp
                    }
                },
                { status: 201 }
            );

        } catch (error) {
            // If an error occurs, abort the transaction
            await session.abortTransaction();
            console.error('Transaction error:', error);
            throw error;
        } finally {
            // End the session
            session.endSession();
        }

    } catch (error) {
        console.error('Error in POST /api/join-room/[roomId]:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { details: error.message })
            },
            { status: 500 }
        );
    }
}