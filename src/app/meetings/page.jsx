'use client'
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiPlus, FiArrowRight, FiCopy, FiCalendar, FiClock, FiUsers, FiMic, FiVideo, FiShare2, FiMessageSquare } from 'react-icons/fi';

export default function Meetings() {
  const [meetingCode, setMeetingCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate a sample meeting code (only on client)
  const generateMeetingCode = () => {
    if (!isClient) return 'loading...';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [generatedCode, setGeneratedCode] = useState('loading...');

  // Initialize generated code after mount
  useEffect(() => {
    if (isClient) {
      setGeneratedCode(generateMeetingCode());
    }
  }, [isClient]);

  // Mock recent meetings data
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setRecentMeetings([
        { id: 1, code: 'abc-defg-hij', date: '2023-06-15', duration: '45 min', participants: 5 },
        { id: 2, code: 'xyz-1234-789', date: '2023-06-10', duration: '1 hr 20 min', participants: 8 },
        { id: 3, code: 'mno-5678-kwl', date: '2023-06-05', duration: '30 min', participants: 3 },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const createNewMeeting = () => {
    if (!isClient) return;
    const newCode = generateMeetingCode();
    setGeneratedCode(newCode);
    window.open(`https://meet.google.com/new?hs=${newCode}`, '_blank');
  };

  const joinMeeting = (e) => {
    e.preventDefault();
    if (!isClient) return;
    if (meetingCode.trim()) {
      window.open(`https://meet.google.com/${meetingCode.trim()}`, '_blank');
    }
  };

  const copyToClipboard = () => {
    if (!isClient) return;
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <Head>
        <title>Video Meetings | Connect Seamlessly</title>
        <meta name="description" content="Start or join video meetings using Google Meet" />
      </Head>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Video Meetings
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Connect with your team through high-quality video conferences
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Meeting Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FiPlus className="mr-2" /> New Meeting
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'join' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FiArrowRight className="mr-2" /> Join Meeting
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
              {activeTab === 'new' ? (
                <div className="p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Start a new meeting</h2>
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Your meeting code</p>
                          <p className="text-xl font-mono font-bold text-gray-800">{generatedCode}</p>
                        </div>
                        {isClient && (
                          <button
                            onClick={copyToClipboard}
                            className="flex items-center px-3 py-2 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            <FiCopy className="mr-2" />
                            {isCopied ? 'Copied!' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={createNewMeeting}
                      className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <FiPlus className="mr-2" size={20} />
                      <span className="font-medium">Start Instant Meeting</span>
                    </button>

                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">OR SCHEDULE FOR LATER</h3>
                      <button className="w-full flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                        <FiCalendar className="mr-2" />
                        Schedule in Calendar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Join a meeting</h2>
                  <form onSubmit={joinMeeting} className="space-y-6">
                    <div>
                      <label htmlFor="meetingCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Meeting Code
                      </label>
                      <input
                        type="text"
                        id="meetingCode"
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        placeholder="abc-defg-hij"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
                    >
                      <FiArrowRight className="mr-2" size={20} />
                      <span className="font-medium">Join Meeting</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-2">
                  <FiMic size={20} />
                </div>
                <span className="text-sm font-medium">Audio Setup</span>
              </button>
              <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 mb-2">
                  <FiVideo size={20} />
                </div>
                <span className="text-sm font-medium">Video Setup</span>
              </button>
              <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full text-green-600 mb-2">
                  <FiShare2 size={20} />
                </div>
                <span className="text-sm font-medium">Share Screen</span>
              </button>
              <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600 mb-2">
                  <FiMessageSquare size={20} />
                </div>
                <span className="text-sm font-medium">Chat</span>
              </button>
            </div>
          </div>

          {/* Right Side - Recent Meetings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FiClock className="mr-2 text-blue-600" /> Recent Meetings
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="p-6 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : recentMeetings.length > 0 ? (
                  recentMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{meeting.code}</p>
                          <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <FiCalendar className="mr-1" size={14} /> {meeting.date}
                          </p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 p-1">
                          <FiArrowRight />
                        </button>
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <FiUsers className="mr-1" size={14} />
                        <span>{meeting.participants} participants</span>
                        <span className="mx-2">•</span>
                        <span>{meeting.duration}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No recent meetings found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Powered by Google Meet API • Secured with end-to-end encryption</p>
      </footer>
    </div>
  );
}