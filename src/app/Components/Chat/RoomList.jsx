'use client';

import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FiLock, FiUnlock, FiUsers, FiCalendar, FiUser, FiSearch, FiTrash2 } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function RoomList({ refreshKey, setOnRoomCreated }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [loggedUser, setLoggedUser] = useState(null);
  const userEmail = loggedUser?.email;

  useEffect(() => {
    // Safely parse the cookie
    try {
      const userCookie = Cookies.get('loggedUser');
      if (userCookie) {
        setLoggedUser(JSON.parse(userCookie));
      }
    } catch (err) {
      console.error('Error parsing user cookie:', err);
      // Optionally redirect to login if cookie is invalid
      // router.push('/login');
    }
  }, []);


  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/room', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch rooms (${res.status})`);
        }

        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [router, refreshKey]);

  // console.log(userEmail)

  const handleJoin = async (roomId, isPrivate, userEmail) => {
    try {
      if (!userEmail) {
        toast.error('You must be logged in to join a room');
        router.push('/login');
        return;
      }

      let password;
      if (isPrivate) {
        password = prompt('Enter room password:');
        if (password === null) return;
        if (!password) {
          toast.error('Password is required for private rooms');
          return;
        }
      }

      const res = await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userEmail,
          action: 'join',
          password: password || undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'INCORRECT_PASSWORD') {
          toast.error('Incorrect password. Please try again.');
        } else if (data.code === 'INVALID_ROOM_CONFIG') {
          toast.error('This room is not properly configured. Please contact support.');
        } else if (data.code === 'PASSWORD_REQUIRED') {
          toast.error('This room requires a password.');
        } else {
          toast.error(data.error || 'Failed to join room');
        }
        return;
      }

      toast.success(data.message || 'Successfully joined room!');
      Cookies.set('roomId', roomId);
      router.push('/join-room');
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred');
      console.error('Join room error:', err);
    }
  };
  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteRoom = async (roomId, userEmail) => {
    const confirmed = window.confirm('Are you sure you want to delete this room?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Server error:', data);
        throw new Error(data.error || 'Failed to delete room');
      }

      console.log('Room deleted:', data);
      setOnRoomCreated(prev => !prev); 
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(error.message || 'Something went wrong while deleting the room.');
    }
  };
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-pulse flex space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-72 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <p className="text-gray-500 dark:text-gray-400">Loading rooms...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-medium">Error loading rooms</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state (no rooms or no matching rooms)
  if (filteredRooms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Search input */}
        <div className="mb-8 max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search rooms by name..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-w-md mx-auto p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <FiUsers className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No matching rooms found' : 'No rooms available'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try a different search term'
              : 'Be the first to create a room and start collaborating!'}
          </p>
          <button
            onClick={() => router.push('/create-room')}
            className="px-6 py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            Create Room
          </button>
        </div>
      </div>
    );
  }


  const swiperStyles = `
  /* Custom navigation arrows - positioned outside container */
  .swiper-button-next,
  .swiper-button-prev {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    color: #3b82f6;
    transition: all 0.3s ease;
    top: 50%;
    transform: translateY(-50%);
    margin-top: 0;
    position: absolute;
    z-index: 10;
  }

  /* Left arrow positioned outside left edge */
  .swiper-button-prev {
    left: -2px;
  }

  /* Right arrow positioned outside right edge */
  .swiper-button-next {
    right: -2px;
  }

  /* Hide arrows when at beginning/end */
  .swiper-button-disabled {
    opacity: 0;
    pointer-events: none;
  }

  .swiper-button-next:hover,
  .swiper-button-prev:hover {
    background-color: #f8fafc;
    color: #2563eb;
    transform: translateY(-50%) scale(1.1);
  }

  .swiper-button-next::after,
  .swiper-button-prev::after {
    font-size: 20px;
    font-weight: bold;
  }

  /* Dark mode styles for arrows */
  .dark .swiper-button-next,
  .dark .swiper-button-prev {
    background-color: #1e293b;
    color: #93c5fd;
  }

  .dark .swiper-button-next:hover,
  .dark .swiper-button-prev:hover {
    background-color: #334155;
    color: #60a5fa;
  }

  /* Custom pagination container */
  .swiper-pagination {
    position: relative !important;
    margin-top: 40px !important;
    bottom: auto !important;
  }

  /* Pagination bullets */
  .swiper-pagination-bullet {
    width: 10px;
    height: 10px;
    background: #9ca3af;
    opacity: 0.5;
    transition: all 0.3s ease;
    margin: 0 6px !important;
  }

  .swiper-pagination-bullet-active {
    background: #3b82f6;
    opacity: 1;
    transform: scale(1.2);
  }

  /* Dark mode styles for pagination */
  .dark .swiper-pagination-bullet {
    background: #6b7280;
  }

  .dark .swiper-pagination-bullet-active {
    background: #93c5fd;
  }

  /* Main container adjustments */
  .swiper {
    padding: 0 24px;
  }
`;

  return (
    <>
      <style jsx global>{swiperStyles}</style>
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Available Rooms</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} found
          </p>
        </div>

        {/* Search input */}
        <div className="mb-8 max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search rooms by name..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              640: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="pb-10"
          >
            {filteredRooms.map((room) => (
              <SwiperSlide key={room._id}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow h-full">
                  <div className="p-6 h-full flex flex-col">
                    {/* Privacy badge */}
                    <div className="flex justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${room.isPrivate
                        ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-300'
                        }`}>
                        {room.isPrivate ? (
                          <>
                            <FiLock className="inline mr-1" />
                            Private
                          </>
                        ) : (
                          <>
                            <FiUnlock className="inline mr-1" />
                            Public
                          </>
                        )}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteRoom(room._id, userEmail)}
                          className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title="Delete room"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Room content */}
                    <div className="flex-grow">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{room.name}</h2>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <FiUsers className="flex-shrink-0 mr-2 text-gray-500" />
                          <span>{room.members?.length || 0} members</span>
                        </div>

                        {room.createdBy && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <FiUser className="flex-shrink-0 mr-2 text-gray-500" />
                            <span className="truncate">Created by: {room.createdBy.name || room.createdBy.email || 'Anonymous'}</span>
                          </div>
                        )}

                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <FiCalendar className="flex-shrink-0 mr-2 text-gray-500" />
                          <span>
                            {new Date(room.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Join button */}
                    <button
                      onClick={() => handleJoin(room._id, room.isPrivate, userEmail)}
                      className={`mt-4 w-full cursor-pointer py-2 rounded-lg font-medium transition-colors ${room.isPrivate
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>

  );
}