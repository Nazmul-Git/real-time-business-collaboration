'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { FiMail, FiLock, FiKey, FiLoader, FiArrowRight } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      data.email = email;

      if (res.status === 200) {
        if (data.twoFactorEnabled) {
          setShowOtpField(true);
        } else {
          if(!Cookies.get('loggedUser')){
            Cookies.set('token', data.token);

            
            Cookies.set('loggedUser', JSON.stringify(data));
          }
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.status === 200) {
        Cookies.set('token', data.token);
        Cookies.set('loggedUser', JSON.stringify(data));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.log(error.message)
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {showOtpField ? 'Verify Identity' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600">
              {showOtpField 
                ? 'Enter the 6-digit code sent to your email'
                : 'Sign in to access your account'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={showOtpField ? handleOtpVerification : handleSubmit}>
            {!showOtpField ? (
              <>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <Link href="" className="text-sm text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiKey className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="123456"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Didn't receive code?{' '}
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={handleSubmit}
                  >
                    Resend
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full cursor-pointer flex justify-center items-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition ${loading ? 'opacity-80' : ''}`}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  {showOtpField ? 'Verifying...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {showOtpField ? 'Verify Code' : 'Sign In'}
                  <FiArrowRight className="ml-2" />
                </>
              )}
            </button>
          </form>

          {!showOtpField && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                Sign up
              </Link>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link href="" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}