import React from 'react';

const TypingIndicator = ({ name }) => {
  return (
    <div className="mb-4 flex justify-start">
      <div className="flex flex-col max-w-xs md:max-w-md">
        <span className="text-xs text-gray-500 mb-1">
          {name}
        </span>
        <div className="bg-gray-200 rounded-lg rounded-bl-none px-4 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;