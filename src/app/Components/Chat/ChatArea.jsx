import React from 'react';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import ChatHeader from './ChatHeader';
import DateSeparator from './DateSeparator';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import { format } from 'date-fns';

const ChatArea = ({
  selectedUser,
  loggedUser,
  messages,
  newMessage,
  formatMessageTime,
  handleSendMessage,
  handleInputChange,
  handleKeyPress,
  isConnected,
  typingStatus,
  onlineUsers,
  formatLastSeen,
  getSenderName,
  messagesEndRef,
  inputRef,
  isToday,
  onBack, 
}) => {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with optional back button */}
      <div className="flex items-center border-b border-gray-200 px-4 py-2 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <ChatHeader
            selectedUser={selectedUser}
            onlineUsers={onlineUsers}
            formatLastSeen={formatLastSeen}
          />
        </div>
      </div>

      {/* Messages container - flex-1 to take remaining space */}
      <div className="flex-1 overflow-y-auto bg-gray-50 relative">
        <div className="p-4 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with {selectedUser.name}</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const showDateSeparator =
                  index === 0 ||
                  (!isToday(new Date(message.timestamp)) &&
                    !isToday(new Date(messages[index - 1]?.timestamp)) &&
                    format(new Date(message.timestamp), 'yyyy-MM-dd') !==
                      format(new Date(messages[index - 1]?.timestamp), 'yyyy-MM-dd'));

                return (
                  <React.Fragment key={message._id}>
                    {showDateSeparator && (
                      <DateSeparator timestamp={message.timestamp} />
                    )}
                    <MessageItem
                      message={message}
                      isCurrentUser={message.sender === loggedUser._id}
                      senderName={getSenderName(message)}
                      formatMessageTime={formatMessageTime}
                    />
                  </React.Fragment>
                );
              })}
              {typingStatus[selectedUser._id] && (
                <TypingIndicator name={selectedUser.name} />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="ml-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend size={20} />
          </button>
        </div>
        {!isConnected && (
          <div className="text-xs text-red-500 mt-2">
            Connection lost - messages will be sent when reconnected
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;