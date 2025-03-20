import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

export async function GET() {
    try {
      await dbConnect();
  
      // Fetch all users, excluding passwords
      const users = await User.find({}, { password: 0 });
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }