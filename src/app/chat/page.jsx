'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import ContactsList from '../Components/Chat/ContactsList';
import ChatArea from '../Components/Chat/ChatArea';
import EmptyState from '../Components/Chat/EmptyState';
import Cookies from 'js-cookie';

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

  // Format message time
  const formatMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen a long time ago';
    
    try {
      const date = new Date(timestamp);
      if (isToday(date)) {
        return `Last seen today at ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Last seen yesterday at ${format(date, 'h:mm a')}`;
      }
      return `Last seen ${formatDistanceToNow(date)} ago`;
    } catch (error) {
      console.error('Error formatting last seen time:', error);
      return 'Last seen recently';
    }
  };

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
          
          // Load conversations from localStorage if available
          const savedConversations = Cookies.get('conversations');
          if (savedConversations) {
            setConversations(JSON.parse(savedConversations));
          }
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

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(conversations).length > 0) {
      Cookies.set('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

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

  // Enhanced handleMessage function with database sync
  const handleMessage = useCallback(async (message) => {
    try {
      // First, update UI optimistically
      setConversations(prev => {
        const existingMessages = prev[message.sender] || [];
        const updatedConversations = {
          ...prev,
          [message.sender]: [...existingMessages, message]
        };
        return updatedConversations;
      });

      // Save to database
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) throw new Error('Failed to save message');

      const savedMessage = await response.json();

      // Update with database ID if needed
      setConversations(prev => ({
        ...prev,
        [message.sender]: prev[message.sender].map(msg => 
          msg._id === message._id ? savedMessage.data : msg
        )
      }));

      // Rest of the message handling logic
      if (selectedUser?._id === message.sender) {
        setMessages(prev => [...prev, savedMessage.data]);
        scrollToBottom();
        markAsRead([savedMessage.data._id], message.sender);
      } else {
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
    } catch (error) {
      console.error('Error handling message:', error);
      // Rollback UI if database save failed
      setConversations(prev => ({
        ...prev,
        [message.sender]: prev[message.sender].filter(msg => msg._id !== message._id)
      }));
    }
  }, [selectedUser, users]);

  // Handle incoming real-time messages
  useEffect(() => {
    if (!socketRef.current) return;

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
  }, [handleMessage]);

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

  // Enhanced send message function with database sync
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

      // Save to database first
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) throw new Error('Failed to save message');

      const savedMessage = await response.json();

      // Update UI with database-persisted message
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...savedMessage.data, status: 'delivered' } : msg
      ));
      
      setConversations(prev => ({
        ...prev,
        [selectedUser._id]: prev[selectedUser._id].map(msg => 
          msg._id === tempId ? { ...savedMessage.data, status: 'delivered' } : msg
        )
      }));

      // Then send via WebSocket
      sendMessage({ ...savedMessage.data, status: 'delivered' });
    } catch (error) {
      console.error('Error sending message:', error);
      // Rollback on error
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

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Get last message for a user with improved sorting
  const getLastMessage = useCallback((userId) => {
    const conversation = conversations[userId] || [];
    if (!conversation.length) return { text: 'No messages yet', time: '', isUnread: false, timestamp: 0 };

    const lastMsg = conversation[conversation.length - 1];
    const isUnread = lastMsg.sender !== loggedUser?._id && lastMsg.status !== 'read';

    return {
      text: lastMsg.content.length > 30
        ? `${lastMsg.content.substring(0, 30)}...`
        : lastMsg.content,
      time: formatMessageTime(lastMsg.timestamp),
      isUnread,
      timestamp: new Date(lastMsg.timestamp).getTime()
    };
  }, [conversations, loggedUser]);

  // Sort users by last message time with proper fallbacks
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aLastMsg = getLastMessage(a._id);
      const bLastMsg = getLastMessage(b._id);
      
      // If both have messages, sort by timestamp
      if (aLastMsg.timestamp && bLastMsg.timestamp) {
        return bLastMsg.timestamp - aLastMsg.timestamp;
      }
      
      // If only one has messages, put that one first
      if (aLastMsg.timestamp && !bLastMsg.timestamp) return -1;
      if (!aLastMsg.timestamp && bLastMsg.timestamp) return 1;
      
      // If neither has messages, maintain original order
      return 0;
    });
  }, [filteredUsers, getLastMessage]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!loggedUser) return <div className="text-center p-8">Please log in to use the chat</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Notification sound element (hidden) */}
      {/* <audio ref={notificationSoundRef} src="/notification.mp3" preload="auto" /> */}

      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-2rem)]">
        <ContactsList
          loggedUser={loggedUser}
          users={sortedUsers}
          selectedUser={selectedUser}
          handleUserSelect={handleUserSelect}
          unreadCounts={unreadCounts}
          getLastMessage={getLastMessage}
          typingStatus={typingStatus}
          onlineUsers={onlineUsers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          markAllNotificationsAsRead={markAllNotificationsAsRead}
          isConnected={isConnected}
          formatMessageTime={formatMessageTime}
        />

        {selectedUser ? (
          <ChatArea
            selectedUser={selectedUser}
            loggedUser={loggedUser}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            handleInputChange={handleInputChange}
            handleKeyPress={handleKeyPress}
            isConnected={isConnected}
            typingStatus={typingStatus}
            onlineUsers={onlineUsers}
            formatLastSeen={formatLastSeen}
            getSenderName={getSenderName}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            formatMessageTime={formatMessageTime}
            isToday={isToday}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default Messenger;