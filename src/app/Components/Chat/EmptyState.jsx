import React from 'react';
import { FiEdit2 } from 'react-icons/fi';

const EmptyState = () => {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center">
      <div className="text-center p-6 max-w-md">
        <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <FiEdit2 size={40} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-medium mb-2">Select a chat</h3>
        <p className="text-gray-500">
          Choose a conversation from the sidebar to start messaging or search for a contact.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;