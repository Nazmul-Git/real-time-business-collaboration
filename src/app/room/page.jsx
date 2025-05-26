'use client';
import React, { useState } from 'react';
import CreateRoomForm from '../Components/Chat/CreateRoomForm';
import RoomList from '../Components/Chat/RoomList';

export default function Page() {
    const [onRoomCreated, setOnRoomCreated] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="px-4 py-3 mb-4">
                <h1 className="text-2xl font-semibold text-gray-800">Chat Rooms</h1>
                <p className="text-sm text-gray-500">Create or join a chat room below</p>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 space-y-6">
                <CreateRoomForm setOnRoomCreated={setOnRoomCreated} />
                <RoomList refreshKey={onRoomCreated} setOnRoomCreated={setOnRoomCreated} />
            </main>
        </div>
    );
}
