'use client'
import React, { useState } from 'react'
import CreateRoomForm from '../Components/Chat/CreateRoomForm'
import RoomList from '../Components/Chat/RoomList'

export default function page() {
    const [onRoomCreated, setOnRoomCreated]= useState(false);
    return (
        <>
            <CreateRoomForm setOnRoomCreated={setOnRoomCreated}/>
            <RoomList refreshKey={onRoomCreated}/>
        </>
    )
}
