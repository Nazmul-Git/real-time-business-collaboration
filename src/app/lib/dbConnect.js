import mongoose from "mongoose";

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) {
    // If already connected, return the existing connection
    return mongoose.connection.db;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected!");
    return mongoose.connection.db; // Return the database instance
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default dbConnect;