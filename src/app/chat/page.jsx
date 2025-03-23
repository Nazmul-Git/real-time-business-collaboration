'use client';
import { useEffect, useState } from 'react';
import { FiSearch, FiEdit2 } from 'react-icons/fi';

const Messenger = () => {
  const [users, setUsers] = useState([]);
  const [loggedUser, setLoggedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); 
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedUser');
    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();

        if (storedUser) {
          const loggedUserData = JSON.parse(storedUser);
          const filteredUsers = data.filter(user => user.email !== loggedUserData.email);
          setUsers(filteredUsers);
        } else {
          setUsers(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex justify-center">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 flex">

        {!selectedUser || !isMobile ? (
          <div className={`w-${selectedUser && !isMobile ? '1/2' : 'full'} transition-all md:block ${selectedUser && isMobile ? 'hidden' : 'block'}`}>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
              <div className='flex justify-evenly gap-2 items-center'>
                <FiEdit2 className="text-gray-500 dark:text-gray-300 cursor-pointer" size={20} />
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-400 text-white font-bold text-2xl uppercase">
                  {loggedUser.email.charAt(0)}
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Actives</h2>
              <div className="flex space-x-3 overflow-x-auto">
                {users.slice(0, 5).map((user) => (
                  <div key={user._id} className="relative w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg">
                    {user.name.charAt(0)}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Messages</h2>
              <ul>
                {users.map((user) => (
                  <li
                    key={user._id}
                    className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
                        <p className="text-gray-500 text-sm truncate">Last message...</p>
                      </div>
                      <span className="text-xs text-gray-400">5m</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {selectedUser && (
          <div className={`transition-all ${isMobile ? 'w-full' : 'w-1/2'} border-l border-gray-300 dark:border-gray-600 p-4`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
              <button className="text-gray-500 dark:text-gray-300" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="h-80 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex flex-col justify-center items-center">
              <p className="text-gray-600 dark:text-gray-300">Chat with {selectedUser.name} coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
