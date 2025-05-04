'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiSearch, FiEdit2, FiSend, FiMoreVertical, FiChevronDown, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { BsThreeDotsVertical, BsCheck2All } from 'react-icons/bs';
import { IoMdNotifications } from 'react-icons/io';
import io from 'socket.io-client';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const Messenger = () => {
  // State
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loggedUser, setLoggedUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    // Connection events
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Socket.IO server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Socket.IO server');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    socketRef.current.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Register user when loggedUser changes
  useEffect(() => {
    if (socketRef.current && loggedUser?._id) {
      socketRef.current.emit('register', loggedUser._id);
    }
  }, [loggedUser]);

  // Fetch users and initialize
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();

        const storedUser = localStorage.getItem('loggedUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const fullUser = data.find(user => user.email === userData.email) || userData;
          setLoggedUser(fullUser);
          const filteredUsers = data.filter(user => user._id !== fullUser._id);
          setUsers(filteredUsers);
          setOriginalUsers(filteredUsers);
        } else {
          setUsers(data);
          setOriginalUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Reset to original order when search is cleared and no unread messages
  useEffect(() => {
    if (!searchTerm && originalUsers.length > 0) {
      const hasUnread = Object.values(unreadCounts).some(count => count > 0);
      if (!hasUnread) {
        setUsers([...originalUsers]);
      }
    }
  }, [searchTerm, originalUsers, unreadCounts]);

  // Load messages when a user is selected
  useEffect(() => {
    if (!selectedUser || !loggedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${loggedUser._id}&contactId=${selectedUser._id}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
          
          setConversations(prev => ({
            ...prev,
            [selectedUser._id]: data.data
          }));
          
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    fetchMessages();
  }, [selectedUser, loggedUser]);

  // Handle incoming real-time messages
  useEffect(() => {
    if (!socketRef.current) return;

    const handleMessage = (message) => {
      // Play notification sound if message is not from current chat
      if (selectedUser?._id !== message.sender) {
        playNotificationSound();
        showDesktopNotification(message);
      }

      // Update conversations
      setConversations(prev => {
        const existingMessages = prev[message.sender] || [];
        const updatedMessages = [...existingMessages, message];
        
        return {
          ...prev,
          [message.sender]: updatedMessages
        };
      });

      // Move sender to top of users list if not already selected
      setUsers(prev => {
        if (prev[0]?._id === message.sender) return prev;
        
        const senderIndex = prev.findIndex(u => u._id === message.sender);
        if (senderIndex > 0) {
          const updated = [...prev];
          const [sender] = updated.splice(senderIndex, 1);
          return [sender, ...updated];
        }
        return prev;
      });

      // If this is the active chat, update messages and mark as read
      if (selectedUser?._id === message.sender) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        markAsRead([message._id], message.sender);
      } else {
        // Update unread count for other chats
        setUnreadCounts(prev => ({
          ...prev,
          [message.sender]: (prev[message.sender] || 0) + 1
        }));

        // Add notification
        const sender = users.find(u => u._id === message.sender);
        if (sender) {
          setNotifications(prev => [
            {
              id: message._id,
              sender: sender.name,
              message: message.content,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...prev
          ]);
        }
      }
    };

    const handleStatusUpdate = ({ messageId, messageIds, status }) => {
      const ids = messageIds || [messageId];
      
      // Update messages in current chat
      setMessages(prev =>
        prev.map(msg =>
          ids.includes(msg._id) ? { ...msg, status } : msg
        )
      );

      // Update all conversations
      setConversations(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = updated[id].map(msg =>
            ids.includes(msg._id) ? { ...msg, status } : msg
          );
        });
        return updated;
      });
    };

    const handleTyping = ({ sender }) => {
      setTypingStatus(prev => ({ ...prev, [sender]: true }));
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(prev => ({ ...prev, [sender]: false }));
      }, 2000);
    };

    socketRef.current.on('message', handleMessage);
    socketRef.current.on('message-status', handleStatusUpdate);
    socketRef.current.on('typing', handleTyping);

    return () => {
      socketRef.current.off('message', handleMessage);
      socketRef.current.off('message-status', handleStatusUpdate);
      socketRef.current.off('typing', handleTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedUser, users]);

  // Play notification sound
  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // Show desktop notification
  const showDesktopNotification = (message) => {
    if (Notification.permission === 'granted') {
      const sender = users.find(u => u._id === message.sender);
      if (sender) {
        new Notification(`${sender.name}`, {
          body: message.content,
          icon: '/notification-icon.png'
        });
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showDesktopNotification(message);
        }
      });
    }
  };

  // Send message via WebSocket and API
  const sendMessage = useCallback(async (message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message', message);
    }
  }, [isConnected]);

  // Mark messages as read via WebSocket and API
  const markAsRead = useCallback(async (messageIds, senderId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark-as-read', {
        messageIds,
        sender: senderId,
        receiver: loggedUser._id
      });
      
      try {
        await fetch('/api/chat', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds, status: 'read' })
        });
        
        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: 0
        }));

        // Mark notifications as read
        setNotifications(prev => 
          prev.map(notif => 
            messageIds.includes(notif.id) ? { ...notif, read: true } : notif
          )
        );
      } catch (error) {
        console.error('Error updating read status:', error);
      }
    }
  }, [isConnected, loggedUser]);

  // Send typing indicator
  const sendTyping = useCallback((receiverId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', {
        sender: loggedUser._id,
        receiver: receiverId
      });
    }
  }, [isConnected, loggedUser]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Select a user to chat with
  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
    setUnreadCounts(prev => ({ ...prev, [user._id]: 0 }));

    // Mark messages as read
    const unreadMessages = (conversations[user._id] || [])
      .filter(msg => msg.sender === user._id && msg.status !== 'read')
      .map(msg => msg._id);

    if (unreadMessages.length) {
      markAsRead(unreadMessages, user._id);
    }

    // Focus input after selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [conversations, markAsRead]);

  // Send a new message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedUser || !isConnected || !loggedUser) return;

    const tempId = Date.now().toString();
    const messageData = {
      sender: loggedUser._id,
      receiver: selectedUser._id,
      content: newMessage.trim()
    };

    try {
      // Optimistic UI update
      const tempMessage = {
        ...messageData,
        _id: tempId,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setConversations(prev => ({
        ...prev,
        [selectedUser._id]: [...(prev[selectedUser._id] || []), tempMessage]
      }));
      setNewMessage('');
      scrollToBottom();

      // Save to database
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) throw new Error('Failed to save message');
      
      const savedMessage = await response.json();
      
      // Replace temporary message with saved one
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...savedMessage.data, status: 'delivered' } : msg
      ));
      
      setConversations(prev => ({
        ...prev,
        [selectedUser._id]: prev[selectedUser._id].map(msg => 
          msg._id === tempId ? { ...savedMessage.data, status: 'delivered' } : msg
        )
      }));

      // Send via WebSocket
      sendMessage({ ...savedMessage.data, status: 'delivered' });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setConversations(prev => ({
        ...prev,
        [selectedUser._id]: prev[selectedUser._id].filter(msg => msg._id !== tempId)
      }));
    }
  }, [newMessage, selectedUser, loggedUser, scrollToBottom, sendMessage, isConnected]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (selectedUser && isConnected) {
      sendTyping(selectedUser._id);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get sender name for message
  const getSenderName = (message) => {
    if (message.sender === loggedUser?._id) return "You";
    return users.find(u => u._id === message.sender)?.name || "Unknown";
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen a long time ago';
    
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Last seen today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Last seen yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return `Last seen ${formatDistanceToNow(date)} ago`;
    }
  };

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Get last message for a user
  const getLastMessage = useCallback((userId) => {
    const conversation = conversations[userId] || [];
    if (!conversation.length) return { text: 'No messages yet', time: '', isUnread: false };

    const lastMsg = conversation[conversation.length - 1];
    const isUnread = lastMsg.sender !== loggedUser?._id && lastMsg.status !== 'read';
    
    return {
      text: lastMsg.content.length > 30
        ? `${lastMsg.content.substring(0, 30)}...`
        : lastMsg.content,
      time: formatMessageTime(lastMsg.timestamp),
      isUnread,
      timestamp: lastMsg.timestamp
    };
  }, [conversations, loggedUser]);

  // Sort users by last message time
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aLastMsg = getLastMessage(a._id).timestamp || '0';
      const bLastMsg = getLastMessage(b._id).timestamp || '0';
      return new Date(bLastMsg) - new Date(aLastMsg);
    });
  }, [filteredUsers, getLastMessage]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Memoized Message component
  const MessageItem = useMemo(() =>
    React.memo(({ message, isCurrentUser, senderName }) => (
      <div className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex flex-col max-w-xs md:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          {!isCurrentUser && (
            <span className="text-xs text-gray-500 mb-1">
              {senderName}
            </span>
          )}
          <div
            className={`rounded-lg px-4 py-2 ${isCurrentUser
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
    )), []);

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!loggedUser) return <div className="text-center p-8">Please log in to use the chat</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Notification sound element (hidden) */}
      <audio ref={notificationSoundRef} src="/notification.mp3" preload="auto" />
      
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-2rem)]">
        {/* Contacts sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
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
                </div>
                <div className="relative">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg uppercase">
                    {loggedUser.email.charAt(0)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            </div>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-4 md:right-auto md:left-1/3 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200">
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
            )}

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

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">Recent Conversations</h2>
              <ul className="space-y-2">
                {sortedUsers.map((user) => (
                  <li
                    key={user._id}
                    className={`p-3 rounded-lg transition-all cursor-pointer relative ${selectedUser?._id === user._id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-100'
                      }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    {unreadCounts[user._id] > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCounts[user._id]}
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg">
                          {user.name.charAt(0)}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className={`text-sm truncate ${getLastMessage(user._id).isUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {typingStatus[user._id] ? (
                            <span className="text-blue-500">typing...</span>
                          ) : (
                            getLastMessage(user._id).text
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {getLastMessage(user._id).time}
                        </span>
                        {getLastMessage(user._id).isUnread && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Chat area */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col">
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
              <button className="p-2 rounded-full hover:bg-gray-100">
                <BsThreeDotsVertical />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation with {selectedUser.name}</p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    // Check if we should show date separator
                    const showDateSeparator = index === 0 || 
                      !isToday(new Date(message.timestamp)) && 
                      !isToday(new Date(messages[index - 1].timestamp)) &&
                      format(new Date(message.timestamp), 'yyyy-MM-dd') !== 
                      format(new Date(messages[index - 1].timestamp), 'yyyy-MM-dd');

                    return (
                      <React.Fragment key={message._id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {isToday(new Date(message.timestamp)) 
                                ? 'Today' 
                                : isYesterday(new Date(message.timestamp))
                                ? 'Yesterday'
                                : format(new Date(message.timestamp), 'MMMM d, yyyy')}
                            </div>
                          </div>
                        )}
                        <MessageItem
                          message={message}
                          isCurrentUser={message.sender === loggedUser._id}
                          senderName={getSenderName(message)}
                        />
                      </React.Fragment>
                    );
                  })}
                  {typingStatus[selectedUser._id] && (
                    <div className="mb-4 flex justify-start">
                      <div className="flex flex-col max-w-xs md:max-w-md">
                        <span className="text-xs text-gray-500 mb-1">
                          {selectedUser.name}
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
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

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
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
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
        )}
      </div>
    </div>
  );
};

export default Messenger;