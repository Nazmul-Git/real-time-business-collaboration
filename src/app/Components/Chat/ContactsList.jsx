import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoMdNotifications } from 'react-icons/io';
import NotificationDropdown from './NotificationDropdown';
import UserItem from './UserItem';

const ContactsList = ({
  loggedUser,
  users,
  selectedUser,
  handleUserSelect,
  unreadCounts,
  getLastMessage,
  typingStatus,
  onlineUsers,
  searchTerm,
  setSearchTerm,
  notifications,
  showNotifications,
  setShowNotifications,
  markAllNotificationsAsRead,
  isConnected,
}) => {
  return (
    <div className="w-full border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Chats</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                <IoMdNotifications size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  markAllNotificationsAsRead={markAllNotificationsAsRead}
                />
              )}
            </div>
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg uppercase">
                {loggedUser.email?.charAt(0)}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-130px)]">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Recent Conversations</h2>
          <ul className="space-y-2">
            {users.map((user) => (
              <UserItem
                key={user._id}
                user={user}
                selectedUser={selectedUser}
                handleUserSelect={handleUserSelect}
                unreadCount={unreadCounts[user._id]}
                lastMessage={getLastMessage(user._id)}
                isTyping={typingStatus[user._id]}
                isOnline={onlineUsers.includes(user._id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;