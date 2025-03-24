import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

// Fetch all users (excluding password)
export async function GET(req) {
    try {
        await dbConnect();

        // Check if we are querying for a specific user by email
        const { searchParams } = new URL(req.url); // Use URL to handle query params
        const email = searchParams.get("email");  // Get email from query params

        if (email) {
            // Fetch user by email if provided
            const user = await User.findOne({ email }, { password: 0 });
            if (!user) {
                return new Response(
                    JSON.stringify({ error: "User not found" }),
                    {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
            return new Response(JSON.stringify(user), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } else {
            // Fetch all users if no email is provided
            const users = await User.find({}, { password: 0 });
            return new Response(JSON.stringify(users), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        return new Response(
            JSON.stringify({ message: "Internal server error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
