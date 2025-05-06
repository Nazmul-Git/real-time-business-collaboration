import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

const DateSeparator = ({ timestamp }) => {
  const date = new Date(timestamp);
  let displayText;
  
  if (isToday(date)) {
    displayText = 'Today';
  } else if (isYesterday(date)) {
    displayText = 'Yesterday';
  } else {
    displayText = format(date, 'MMMM d, yyyy');
  }

  return (
    <div className="flex justify-center my-4">
      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        {displayText}
      </div>
    </div>
  );
};

export default DateSeparator;