"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
      console.log(data);
      const role = data?.role;
      const userRole = {role};
  
      if (res.status === 200) {
        if (data.twoFactorEnabled) {
          setShowOtpField(true);
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", JSON.stringify(userRole));
          router.push("/dashboard");
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Something went wrong");
    }
  };
  
  

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
  
      const data = await res.json();
      console.log(data);
  
      if (res.status === 200) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard"); 
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Something went wrong");
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {showOtpField ? "Verify OTP" : "Login"}
        </h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={showOtpField ? handleOtpVerification : handleSubmit}>
          {!showOtpField ? (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          ) : (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 cursor-pointer rounded-lg hover:bg-blue-600"
          >
            {showOtpField ? "Verify OTP" : "Login"}
          </button>
        </form>
        {!showOtpField && (
          <p className="mt-4 text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-500 cursor-pointer hover:underline">
              Sign Up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
