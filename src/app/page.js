import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Real-Time Business Collaboration Suite
      </h1>
      <p className="text-gray-600 mb-8">
        Collaborate seamlessly with your team using live chat, task management, and real-time document editing.
      </p>
      <div className="flex space-x-4">
        <Link
          href="/login"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
