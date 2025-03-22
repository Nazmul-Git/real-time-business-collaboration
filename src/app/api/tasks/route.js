import dbConnect from "@/app/lib/dbConnect";
import Task from "@/app/models/Task";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

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
    const { title, description, status, project, userIds } = await req.json();

    // Ensure userIds is an array before mapping
    const objectIdUserIds = Array.isArray(userIds)
      ? userIds.map(id => new mongoose.Types.ObjectId(id))
      : [];

    console.log("userIds:", userIds);
    console.log("Converted ObjectIds:", objectIdUserIds);

    const newTask = new Task({
      title,
      description,
      status: status || "todo",
      project,
      currentStatus: status || "todo",
      userIds: objectIdUserIds,
    });

    await newTask.save();
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ message: "Failed to create task", error: error.message }, { status: 500 });
  }
}

