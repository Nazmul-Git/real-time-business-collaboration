'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { FiSearch, FiEdit2, FiSend } from 'react-icons/fi';
import { io } from 'socket.io-client';

const Messenger = () => {
  const [users, setUsers] = useState([]);
  const [loggedUser, setLoggedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize WebSocket connection and restore state
  useEffect(() => {
    const storedUser = localStorage.getItem('loggedUser');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    setLoggedUser(user);

    const initializeSocket = () => {
      // 1. Verify the WebSocket URL is correct
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER;
      if (!socketUrl) {
        console.error('Socket server URL is not defined');
        setError('Server configuration error');
        return;
      }

      // 2. Enhanced socket options with debugging
      const socketOptions = {
        path: '/socket.io',
        query: { userId: user.email },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        transports: ['websocket', 'polling'], // Fallback to polling if WS fails
        autoConnect: true,
        withCredentials: true,
        secure: process.env.NODE_ENV === 'production',
        // Enable debugging
        debug: process.env.NODE_ENV !== 'production',
      };

      console.log('Connecting to WebSocket at:', socketUrl);

      const newSocket = io(socketUrl, socketOptions);
      socketRef.current = newSocket;

      // 3. Enhanced error handling
      const onConnect = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        newSocket.emit('register', user.email);
      };

      const onConnectError = (err) => {
        console.error('WebSocket connection error:', err);
        setIsConnected(false);

        // Specific error messages for common cases
        if (err.message.includes('ECONNREFUSED')) {
          setError('Server is not available. Please try again later.');
        } else if (err.message.includes('websocket error')) {
          setError('Network issue detected. Trying to reconnect...');
        } else {
          setError(`Connection error: ${err.message}`);
        }
      };

      const onDisconnect = (reason) => {
        console.log('Disconnected:', reason);
        setIsConnected(false);

        if (reason === 'transport close') {
          setError('Connection lost. Reconnecting...');
        } else if (reason === 'io server disconnect') {
          setError('Server disconnected. Will try to reconnect...');
          setTimeout(() => newSocket.connect(), 5000);
        }
      };

      // 4. Message handlers
      const onMessage = (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      };

      // 5. Set up all event listeners
      newSocket.on('connect', onConnect);
      newSocket.on('connect_error', onConnectError);
      newSocket.on('disconnect', onDisconnect);
      newSocket.on('message', onMessage);

      return () => {
        // Clean up all listeners
        newSocket.off('connect', onConnect);
        newSocket.off('connect_error', onConnectError);
        newSocket.off('disconnect', onDisconnect);
        newSocket.off('message', onMessage);

        if (newSocket.connected) {
          newSocket.disconnect();
        }
      };
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle incoming messages
  useEffect(() => {
    if (!socket || !loggedUser) return;

    const handleIncomingMessage = (message) => {
      const isIncoming = message.sender !== loggedUser.email;
      const otherUserEmail = isIncoming ? message.sender : message.receiver;

      setConversations(prev => {
        const updatedConversations = {
          ...prev,
          [otherUserEmail]: [...(prev[otherUserEmail] || []), message]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        };
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      });

      if (selectedUser?.email === otherUserEmail) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();

        if (isIncoming) {
          socket.emit('message-read', {
            messageId: message.id,
            sender: message.sender,
            receiver: message.receiver
          });
        }
      }

      if (isIncoming && selectedUser?.email !== otherUserEmail) {
        setUnreadCounts(prev => ({
          ...prev,
          [otherUserEmail]: (prev[otherUserEmail] || 0) + 1
        }));
      }
    };

    const handleMessageStatusUpdate = (data) => {
      setConversations(prev => {
        const updatedConversations = { ...prev };
        for (const email in updatedConversations) {
          updatedConversations[email] = updatedConversations[email].map(msg => {
            if (msg.id === data.messageId) {
              return { ...msg, status: data.status };
            }
            return msg;
          });
        }
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      });

      if (selectedUser) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    };

    socket.on('message', handleIncomingMessage);
    socket.on('message-status', handleMessageStatusUpdate);

    return () => {
      socket.off('message', handleIncomingMessage);
      socket.off('message-status', handleMessageStatusUpdate);
    };
  }, [socket, selectedUser, loggedUser]);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();

        const storedUser = localStorage.getItem('loggedUser');
        if (storedUser) {
          const loggedUserData = JSON.parse(storedUser);
          const filteredUsers = data.filter((user) => user.email !== loggedUserData.email);
          setUsers(filteredUsers);
        } else {
          setUsers(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const getLastMessage = useCallback((userEmail) => {
    const conversation = conversations[userEmail] || [];
    if (conversation.length === 0) {
      return { text: 'No messages yet', time: '' };
    }
    const lastMsg = conversation[conversation.length - 1];
    return {
      text: lastMsg.content.length > 30
        ? `${lastMsg.content.substring(0, 30)}...`
        : lastMsg.content,
      time: new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }, [conversations]);

  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
    localStorage.setItem('selectedUser', JSON.stringify(user));
    setUnreadCounts(prev => ({ ...prev, [user.email]: 0 }));

    const userMessages = (conversations[user.email] || [])
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setMessages(userMessages);

    if (socket && loggedUser) {
      const unreadMessages = userMessages.filter(
        msg => msg.sender === user.email && msg.status !== 'read'
      );

      if (unreadMessages.length > 0) {
        socket.emit('mark-as-read', {
          sender: user.email,
          receiver: loggedUser.email,
          messageIds: unreadMessages.map(msg => msg.id)
        });
      }
    }

    setTimeout(scrollToBottom, 100);
  }, [conversations, scrollToBottom, socket, loggedUser]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedUser || !socket || !loggedUser) return;

    const message = {
      id: Date.now().toString(),
      sender: loggedUser.email,
      receiver: selectedUser.email,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Optimistic update
    setMessages(prev => [...prev, message]);
    setConversations(prev => {
      const updated = {
        ...prev,
        [selectedUser.email]: [...(prev[selectedUser.email] || []), message]
      };
      localStorage.setItem('conversations', JSON.stringify(updated));
      return updated;
    });

    setNewMessage('');
    scrollToBottom();

    // Send message via socket
    if (isConnected) {
      socket.emit('message', message);
    } else {
      // If not connected, store message to send when connection is restored
      const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
      pendingMessages.push(message);
      localStorage.setItem('pendingMessages', JSON.stringify(pendingMessages));
      setError('Message will be sent when connection is restored');
    }

    // Simulate message delivery
    setTimeout(() => {
      if (socket && isConnected) {
        socket.emit('message-delivered', {
          messageId: message.id,
          sender: message.sender,
          receiver: message.receiver
        });
      }
    }, 1000);
  }, [newMessage, selectedUser, socket, loggedUser, scrollToBottom, isConnected]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSenderName = (message) => {
    if (message.sender === loggedUser?.email) {
      return "You";
    }
    return users.find(user => user.email === message.sender)?.name || "Unknown";
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  if (!loggedUser) return <div className="text-center text-red-500">User not logged in</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6 flex justify-center">
      {/* Connection status indicator */}
      <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm flex items-center ${isConnected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-white' : 'bg-black'}`}></span>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Connection error banner */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-md shadow-lg flex items-center z-50">
          <span>{error}</span>
          <button
            onClick={() => {
              setError(null);
              if (socketRef.current) socketRef.current.connect();
            }}
            className="ml-2 bg-white px-2 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-2rem)]">
        {/* Contacts sidebar */}
        <div className={`${selectedUser && isMobile ? 'hidden' : 'block'} w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
              <div className="flex items-center gap-2">
                <FiEdit2 className="text-gray-500 dark:text-gray-300 cursor-pointer hover:text-blue-500" size={20} />
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg uppercase">
                  {loggedUser.email.charAt(0)}
                </div>
              </div>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Conversations</h2>
              <ul className="space-y-2">
                {filteredUsers.map((user) => (
                  <li
                    key={user._id}
                    className={`p-3 rounded-lg transition-all cursor-pointer relative ${selectedUser?.email === user.email
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    {unreadCounts[user.email] > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCounts[user.email]}
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-lg">
                          {user.name.charAt(0)}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-medium truncate">{user.name}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                          {getLastMessage(user.email).text}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {getLastMessage(user.email).time}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Chat area */}
        {selectedUser ? (
          <div className={`${isMobile ? 'fixed inset-0 z-10 bg-white dark:bg-gray-800' : 'flex-1'} flex flex-col`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-lg">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              {isMobile && (
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setSelectedUser(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-700/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation with {selectedUser.name}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id || message.timestamp}
                    className={`mb-4 flex ${message.sender === loggedUser.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex flex-col max-w-xs md:max-w-md">
                      {message.sender !== loggedUser.email && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {getSenderName(message)}
                        </span>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 ${message.sender === loggedUser.email
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-bl-none'
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="flex justify-end items-center mt-1 space-x-1">
                          <span className={`text-xs ${message.sender === loggedUser.email ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.sender === loggedUser.email && (
                            <span className={`text-xs ${message.status === 'read' ? 'text-blue-300' : 'text-blue-100'}`}>
                              {message.status === 'delivered' ? '✓✓' : message.status === 'read' ? '✓✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Message will be sent when connection is restored
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-700/20">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <FiEdit2 size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Select a chat</h3>
              <p className="text-gray-500 dark:text-gray-400">
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