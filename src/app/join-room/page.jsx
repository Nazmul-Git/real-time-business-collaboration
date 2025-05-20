'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  // console.log(roomID)

  // Initialize user and join room
  useEffect(() => {
    // Get logged in user
    const userCookie = Cookies.get('loggedUser');
    const roomIdFromCookie = Cookies.get('roomId');
    setRoomID(roomIdFromCookie);

    if (!userCookie) {
      router.push('/login');
      return;
    }

    const initializeChat = async () => {
      try {
        const user = JSON.parse(userCookie);

        // Fetch user data if needed
        const res = await fetch(`/api/users?email=${user.email}`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const userData = await res.json();
        setLoggedUser(userData);

        // Initialize socket connection
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001', {
          withCredentials: true,
          transports: ['websocket'],
        });

        socket.on('connect', () => {
          socket.emit('join-room', roomIdFromCookie);
        });

        socket.on('message', (message) => {
          if (message.roomId === roomIdFromCookie) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
          }
        });

        socket.on('room-members', (members) => {
          setActiveMembers(members);
        });

        socket.on('typing', (data) => {
          if (data.roomId === roomIdFromCookie && data.userId !== userData._id) {
            setTypingMembers(prev =>
              data.isTyping
                ? [...prev.filter(m => m.id !== data.userId), { id: data.userId, name: data.userName }]
                : prev.filter(m => m.id !== data.userId)
            );
          }
        });

        socketRef.current = socket;

        // Fetch initial room data
        const roomRes = await fetch(`/api/room/${roomIdFromCookie}`);
        if (!roomRes.ok) throw new Error('Failed to load room');
        const roomData = await roomRes.json();
        setRoom(roomData);
        setMessages(roomData.messages || []);

      } catch (err) {
        console.error('Initialization error:', err);
        toast.error(err.message);
        router.push('/');
      }
    };

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [router]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !loggedUser) return;

    const message = {
      roomID,
      userId: loggedUser._id,
      userName: loggedUser.name || loggedUser.email,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('message', message);
    setNewMessage('');
  };

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !loggedUser) return;

    socketRef.current.emit('typing', {
      roomID,
      userId: loggedUser._id,
      userName: loggedUser.name || loggedUser.email,
      isTyping: true
    });

    const timer = setTimeout(() => {
      socketRef.current.emit('typing', {
        roomID,
        userId: loggedUser._id,
        userName: loggedUser.name || loggedUser.email,
        isTyping: false
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [loggedUser, roomID]);

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Room header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <FiArrowLeft className="mr-2" />
            Back
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
            <div className="text-center py-10 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.userId === loggedUser?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${message.userId === loggedUser?._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-sm">
                      {message.userId === loggedUser?._id ? 'You' : message.userName}
                    </div>
                  </div>
                  <p className="mt-1">{message.text}</p>
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
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
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-50"
          >
            <FiSend className="mr-1" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}