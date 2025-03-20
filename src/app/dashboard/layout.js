'use client'
import Link from "next/link";
import { useRouter } from "next/navigation"; 

const Layout = ({ children }) => {
  const router = useRouter(); 

  const logout = () => {
    localStorage.removeItem('token');
    router.push("/login");
  };

  return (
    <div className="flex">
      <div className="w-64 bg-gray-800 text-white p-6 flex flex-col">
        <div className="text-center mb-8 py-6">
          <h2 className="text-2xl font-semibold text-orange-500">Business Collab 🚀</h2>
        </div>
        <ul className="space-y-4">
          <li>
            <Link href="/dashboard">
              <div className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                📊 Dashboard
              </div>
            </Link>
          </li>
          <li>
            <Link href="/projects">
              <div className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                📂 Projects
              </div>
            </Link>
          </li>
          <li>
            <Link href="/teams">
              <div className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                👥 Teams
              </div>
            </Link>
          </li>
          <li>
            <Link href="/meetings">
              <div className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                🗓 Meetings
              </div>
            </Link>
          </li>
          <li>
            <Link href="/chat">
              <div className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                💬 Chat
              </div>
            </Link>
          </li>
          <li>
            <Link href="/profile">
              <div className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                👤 Profile
              </div>
            </Link>
          </li>
          <li>
            <div
              onClick={logout}
              className="block text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer"
            >
              🚪 Logout
            </div>
          </li>
        </ul>
      </div>

      <div className="flex-grow p-8 bg-gray-100">{children}</div>
    </div>
  );
};

export default Layout;
