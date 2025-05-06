import Cookies from "js-cookie";
import Link from "next/link";

export default function Dashboard() {
  const user = Cookies.get('loggedUser');
  console.log(user)
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Tasks</h2>
            <Link href="/tasks" className="text-blue-500 hover:underline">
              View All Tasks
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Notifications</h2>
            <p className="text-gray-600">No new notifications</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Analytics</h2>
            <p className="text-gray-600">Task completion: 75%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
