// components/Loading.js
"use client";

import { motion } from "framer-motion";

export default function LoadingComp() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <motion.div
        className="relative flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-5 h-5 bg-blue-500 rounded-full"
          animate={{ y: [0, -20, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut",
            delay: 0,
          }}
        />
        <motion.div
          className="w-5 h-5 bg-blue-500 rounded-full"
          animate={{ y: [0, -20, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
        <motion.div
          className="w-5 h-5 bg-blue-500 rounded-full"
          animate={{ y: [0, -20, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />
      </motion.div>
    </div>
  );
}