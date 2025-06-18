import Link from "next/link";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">
        Real-Time Business Collaboration Suite
      </h1>
      <p className="text-gray-600 mb-8 text-center text-sm md:text-base max-w-md">
        Collaborate seamlessly with your team using live chat, task management, and real-time document editing.
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto px-4 sm:px-0">
        <Link
          href="/login"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 text-center"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 text-center"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}