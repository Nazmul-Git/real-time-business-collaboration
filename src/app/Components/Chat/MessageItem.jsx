import React from 'react';
import { BsCheck2All } from 'react-icons/bs';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';

const MessageItem = React.memo(({ message, isCurrentUser, senderName, formatMessageTime  }) => {
  return (
    <div className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-xs md:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && (
          <span className="text-xs text-gray-500 mb-1">
            {senderName}
          </span>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isCurrentUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-900 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className={`flex items-center mt-1 space-x-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatMessageTime(message.timestamp)}
            </span>
            {isCurrentUser && (
              <span className={`text-xs ${message.status === 'read' ? 'text-blue-300' : 'text-blue-100'}`}>
                {message.status === 'read' ? (
                  <BsCheck2All />
                ) : message.status === 'delivered' ? (
                  <FiCheckCircle />
                ) : (
                  <FiCheck />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MessageItem;