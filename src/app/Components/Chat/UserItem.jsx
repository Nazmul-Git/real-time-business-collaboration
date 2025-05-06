import React from 'react';

const UserItem = ({ user, selectedUser, handleUserSelect, unreadCount, lastMessage, isTyping, isOnline }) => {
  return (
    <li
      className={`p-3 rounded-lg transition-all cursor-pointer relative ${
        selectedUser?._id === user._id ? 'bg-blue-50' : 'hover:bg-gray-100'
      }`}
      onClick={() => handleUserSelect(user)}
    >
      {unreadCount > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg">
            {user.name.charAt(0)}
          </div>
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}></span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className={`text-sm truncate ${
            lastMessage.isUnread ? 'font-semibold text-gray-900' : 'text-gray-500'
          }`}>
            {isTyping ? (
              <span className="text-blue-500">typing...</span>
            ) : (
              lastMessage.text
            )}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {lastMessage.time}
          </span>
          {lastMessage.isUnread && (
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
          )}
        </div>
      </div>
    </li>
  );
};

export default React.memo(UserItem);