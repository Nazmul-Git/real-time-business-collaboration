import dbConnect from "@/app/lib/dbConnect";

// move a task to the projects collection
export async function POST(request) {
  try {
    const { task } = await request.json();
    const db = await dbConnect();

    // Insert the task into the projects collection
    const result = await db.collection('projects').insertOne(task);
    return Response.json(
      { success: true, message: 'Task moved to projects', data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error moving task to projects:', error);
    return Response.json(
      { success: false, message: 'Failed to move task to projects' },
      { status: 500 }
    );
  }
}

// fetch all projects 
export async function GET() {
  try {
    const db = await dbConnect();
    const projects = await db.collection('projects').find({}).toArray();

    return Response.json(
      { success: true, data: projects },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}