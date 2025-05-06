// app/rooms/page.jsx
'use client';

import CreateRoomForm from "../Components/Chat/CreateRoomForm";
import RoomList from "../Components/Chat/RoomList";

export default function RoomsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Rooms</h1>
      <CreateRoomForm />
      <hr className="my-6" />
      <RoomList />
    </div>
  );
}
