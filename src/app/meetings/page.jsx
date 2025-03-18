// pages/meetings.js
export default function Meetings() {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Video Meetings</h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">Start or join a video meeting.</p>
            <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
              Start Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }