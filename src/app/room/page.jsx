import React from 'react'
import CreateRoomForm from '../Components/Chat/CreateRoomForm'
import RoomList from '../Components/Chat/RoomList'

export default function page() {
    return (
        <>
            <CreateRoomForm />
            <RoomList />
        </>
    )
}
