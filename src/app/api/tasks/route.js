import dbConnect from "@/app/lib/dbConnect";
import Task from "@/app/models/Task";
import { NextResponse } from "next/server";

// GET: Fetch all tasks
export async function GET() {
  await dbConnect();
  try {
    const tasks = await Task.find({}).select("title project description status prevStatus currentStatus");
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching tasks", error }, { status: 500 });
  }
}

// POST: Create a new task
export async function POST(req) {
  await dbConnect();
  try {
    const { title, description, status, project } = await req.json();
    const newTask = new Task({ title, description, status: status || "todo", project, currentStatus: status || "todo" });
    await newTask.save();
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create task", error }, { status: 500 });
  }
}
