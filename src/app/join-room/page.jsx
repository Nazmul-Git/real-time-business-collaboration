'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { FiUsers, FiMessageSquare, FiSend, FiArrowLeft } from 'react-icons/fi';
import { io } from 'socket.io-client';

export default function ChatRoom() {
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [roomID, setRoomID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loggedUser, setLoggedUser] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [typingMembers, setTypingMembers] = useState([]);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch messages from API
  const fetchMessages = useCallback(async (roomId) => {
    try {
      const res = await fetch(`/api/join-room/${roomId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Failed to load chat history');
    }
  }, []);

  // Initialize user and join room
  useEffect(() => {
    const userCookie = Cookies.get('loggedUser');
    const roomIdFromCookie = Cookies.get('roomId');
    setRoomID(roomIdFromCookie || null);

    if (!userCookie || !roomIdFromCookie) {
      router.push('/login');
      return;
    }

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        const user = JSON.parse(userCookie);

        // Fetch user data
        const res = await fetch(`/api/users?email=${user.email}`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const userData = await res.json();
        setLoggedUser(userData);

        // Fetch initial messages
        await fetchMessages(roomIdFromCookie);

        // Initialize socket connection
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001', {
          withCredentials: true,
          transports: ['websocket'],
          autoConnect: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        // Connection events
        socket.on('connect', () => {
          console.log('Socket connected');
          socket.emit('join-room', {
            roomId: roomIdFromCookie,
            userId: userData._id,
            userName: userData.name || userData.email
          });
        });

        // Message handling
        socket.on('room-message', (message) => {
          if (message.room.toString() === roomIdFromCookie) {
            setMessages(prev => [...prev, {
              _id: message._id,
              sender: message.sender,
              content: message.content,
              room: message.room,
              timestamp: message.timestamp,
              read: message.read || false
            }]);
            scrollToBottom();
          }
        });

        // Room members updates
        socket.on('room-members', (members) => {
          setActiveMembers(members);
        });

        // Typing indicators
        socket.on('typing', (data) => {
          if (data.roomId === roomIdFromCookie && data.userId !== userData._id) {
            setTypingMembers(prev =>
              data.isTyping
                ? [...prev.filter(m => m.id !== data.userId), { id: data.userId, name: data.userName }]
                : prev.filter(m => m.id !== data.userId)
            );
          }
        });

        // User left notification
        socket.on('user-left', (data) => {
          if (data.roomId === roomIdFromCookie) {
            setActiveMembers(prev => prev.filter(m => m.id !== data.userId));
            toast(`${data.userName} left the room`, { icon: '👋' });
          }
        });

        // Message acknowledgement
        socket.on('message-ack', (ack) => {
          setMessages(prev => prev.map(msg =>
            msg.tempId === ack.tempId ? {
              ...msg,
              _id: ack._id,
              status: 'delivered',
              sender: ack.sender,
              receiver: ack.receiver,
              content: ack.content,
              room: ack.room,
              read: ack.read || false
            } : msg
          ));
        });

        socketRef.current = socket;

        // Fetch room data
        const roomRes = await fetch(`/api/room/${roomIdFromCookie}`);
        if (!roomRes.ok) throw new Error('Failed to load room');
        const roomData = await roomRes.json();
        setRoom(roomData);

      } catch (err) {
        console.error('Initialization error:', err);
        toast.error(err.message || 'An error occurred');
        router.push('/');
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    };

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [router, fetchMessages]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (!socketRef.current?.connected) {
      toast.error('Not connected to chat server');
      return;
    }

    if (!loggedUser || isSending) return;

    const tempId = Date.now().toString();

    const message = {
      tempId,
      sender: loggedUser._id,
      content: newMessage,
      room: roomID,
      timestamp: new Date(),
      status: 'sending',
      read: false
    };


    try {
      setIsSending(true);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();

      // Save to database via API
      const apiResponse = await fetch(`/api/join-room/${roomID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: loggedUser._id,
          content: newMessage,
          room: roomID
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to save message');
      }

      const responseData = await apiResponse.json();
      const savedMessage = responseData.message;

      // Broadcast via socket
      socketRef.current.emit('room-message', {
        ...savedMessage,
        tempId
      });

      // Update UI with final message from server
      setMessages(prev => prev.map(msg =>
        msg.tempId === tempId
          ? {
            ...savedMessage,
            status: 'delivered',
            sender: savedMessage.sender,
            receiver: savedMessage.receiver,
            content: savedMessage.content,
            room: savedMessage.room,
            read: savedMessage.read || false
          }
          : msg
      ));

    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.map(msg =>
        msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
      ));
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !loggedUser) return;

    const emitTyping = (isTyping) => {
      socketRef.current.emit('room-typing', {
        roomId: roomID,
        userId: loggedUser._id,
        userName: loggedUser.name || loggedUser.email,
        isTyping
      });
    };

    emitTyping(true);
    const timer = setTimeout(() => emitTyping(false), 2000);
    return () => {
      clearTimeout(timer);
      emitTyping(false);
    };
  }, [loggedUser, roomID]);

  // Handle leaving room
  const handleLeave = useCallback(async () => {
    if (!loggedUser?._id || !roomID || isLeaving) return;

    try {
      setIsLeaving(true);
      const shouldLeave = window.confirm(
        activeMembers.length > 1
          ? 'Are you sure you want to leave this chat room?'
          : 'Are you sure you want to exit?'
      );
      if (!shouldLeave) return;

      const response = await fetch(`/api/room/${roomID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: loggedUser.email,
          action: 'leave'
        }),
      });

      if (!response.ok) throw new Error('Failed to leave room');

      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-room', {
          roomId: roomID,
          userId: loggedUser._id,
          userName: loggedUser.name || loggedUser.email
        });
        socketRef.current.disconnect();
      }

      Cookies.remove('roomId');
      router.push('/room');
      toast.success('You have left the room');
    } catch (err) {
      console.error('Error leaving room:', err);
      toast.error(err.message || 'Failed to leave room');
    } finally {
      setIsLeaving(false);
    }
  }, [roomID, loggedUser, activeMembers.length, router]);

  if (isLoading || !room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading room...' : 'Room not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Room header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <button
            onClick={handleLeave}
            disabled={isLeaving}
            className={`flex items-center ${isLeaving ? 'opacity-50 cursor-not-allowed' : ''} text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white`}
          >
            {isLeaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Leaving...
              </>
            ) : (
              <>
                <FiArrowLeft className="mr-2" />
                Back
              </>
            )}
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {room.name}
            </h1>
            {typingMembers.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {typingMembers.map(m => m.name).join(', ')} typing...
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <FiUsers className="text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {activeMembers.length} online
            </span>
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 container mx-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id || message.tempId}
                className={`flex ${message.sender === loggedUser?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg p-3 relative ${message.sender === loggedUser?._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                >
                  {message.sender !== loggedUser?._id && (
                    <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                      {activeMembers.find(m => m.id === message.sender)?.name || 'Unknown user'}
                    </div>
                  )}
                  <p className="mt-1">{message.content}</p>
                  <div className={`text-xs mt-1 opacity-70 ${message.sender === loggedUser?._id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {message.read && message.sender === loggedUser?._id && (
                      <span className="ml-1">✓✓</span>
                    )}
                  </div>
                  {message.sender === loggedUser?._id && message.status && (
                    <div className={`absolute -bottom-2 right-2 text-xs ${message.status === 'sending' ? 'text-gray-400' :
                      message.status === 'delivered' ? 'text-green-400' :
                        'text-red-400'
                      }`}>
                      {message.status === 'sending' ? '🔄' :
                        message.status === 'delivered' ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sticky bottom-0">
        <div className="container mx-auto flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isSending || isLeaving}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || isLeaving}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-50"
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FiSend className="mr-1" />
            )}
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}