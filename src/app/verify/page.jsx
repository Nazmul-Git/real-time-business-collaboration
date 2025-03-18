"use client";
import { useState, useRef } from "react";

export default function OTPVerification({ onVerify }) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return; // Allow only numbers

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpCode = otp.join("");
        if (otpCode.length === 6) {
            onVerify(otpCode);
        } else {
            alert("Please enter a 6-digit OTP.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Verify OTP</h2>
                <p className="text-gray-600 text-center mb-6">Enter the 6-digit OTP sent to your email.</p>

                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <div className="flex justify-center space-x-3 mb-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                ref={(el) => (inputRefs.current[index] = el)}
                                className="w-12 h-12 text-xl text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                        Verify OTP
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-600">
                    Didn't receive the code?{" "}
                    <button className="text-blue-500 hover:underline">Resend OTP</button>
                </p>
            </div>
        </div>
    );
}
