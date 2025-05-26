import React from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

const ChatHeader = ({ selectedUser, onlineUsers, formatLastSeen }) => {
  return (
    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg">
            {selectedUser.name.charAt(0)}
          </div>
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            onlineUsers.includes(selectedUser._id) ? 'bg-green-500' : 'bg-gray-400'
          }`}></span>
        </div>
        <div>
          <h2 className="text-lg font-bold">{selectedUser.name}</h2>
          <p className="text-xs text-gray-500">
            {onlineUsers.includes(selectedUser._id) 
              ? 'Online' 
              : formatLastSeen(selectedUser.lastSeenAt)}
          </p>
        </div>
      </div>
      <button className="p-2 rounded-full mr-4 hover:bg-gray-100">
        <BsThreeDotsVertical />
      </button>
    </div>
  );
};

export default ChatHeader;