import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ notifications, markAllNotificationsAsRead }) => {
  return (
    <div className="absolute right-0 md:right-auto md:left-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200">
      <div className="p-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">Notifications</h3>
        <button 
          onClick={markAllNotificationsAsRead}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          Mark all as read
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-3 border-b border-gray-100 ${!notif.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{notif.sender}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(notif.timestamp))} ago
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;