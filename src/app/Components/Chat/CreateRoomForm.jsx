'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function CreateRoomForm({ onRoomCreated }) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getLoggedUserEmail = () => {
    // Get the user data from cookies
    const userData = Cookies.get('loggedUser');
    if (!userData) {
      throw new Error('User not authenticated');
    }
    
    try {
      const user = JSON.parse(userData);
      // console.log(user);
      return user?.email;
    } catch (error) {
      console.error('Error parsing user data:', error);
      throw new Error('Invalid user data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isPrivate && password.length < 4) {
        toast.error('Password must be at least 4 characters');
        return;
      }

      // Get the logged-in user's email
      const creatorEmail = getLoggedUserEmail();
      console.log(creatorEmail)

      setLoading(true);
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          isPrivate,
          password: isPrivate ? password : undefined,
          creatorEmail // Include the creator's email in the request
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const newRoom = await res.json();
      toast.success('Room created successfully!');
      
      // Reset form
      setName('');
      setIsPrivate(false);
      setPassword('');
      
      if (onRoomCreated) onRoomCreated(newRoom);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.message);
      
      // If unauthorized or user data not found, redirect to login
      if (error.message.includes('Unauthorized') || error.message.includes('User not authenticated')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-2">Room Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
          minLength={3}
          maxLength={50}
        />
      </div>
      
      <div className="flex items-center">
        <input
          id="isPrivate"
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="isPrivate" className="ml-2 text-sm font-medium">
          Private Room
        </label>
      </div>
      
      {isPrivate && (
        <div>
          <label htmlFor="password" className="block mb-2 font-medium">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
            minLength={4}
          />
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Creating Room...' : 'Create Room'}
      </button>
    </form>
  );
}