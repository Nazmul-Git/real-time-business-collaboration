import dbConnect from "@/app/lib/dbConnect";
import Task from "@/app/models/Task";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// GET: Fetch all tasks
export async function GET() {
  await dbConnect();
  try {
    const tasks = await Task.find().select("title description project status userIds dueDate createdAt updatedAt");
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching tasks", error }, { status: 500 });
  }
}

// POST: Create a new task
export async function POST(req) {
  await dbConnect();
  try {
    const { title, description, status, project, userIds, dueDate } = await req.json();
    console.log("Request Body:", { title, description, status, project, userIds, dueDate });

    if (!title || !project || !userIds || userIds.length === 0) {
      return NextResponse.json({ message: "Please provide all required fields" }, { status: 400 });
    }

    const objectIdUserIds = Array.isArray(userIds)
      ? userIds.map(id => new mongoose.Types.ObjectId(id))
      : [];

    const formattedDueDate = dueDate ? new Date(dueDate) : null;
    console.log("Formatted Due Date:", formattedDueDate);

    // Create the new task
    const newTask = new Task({
      title,
      description,
      status: status || "todo",
      project,
      currentStatus: status || "todo",
      userIds: objectIdUserIds,
      dueDate: formattedDueDate, // Ensure dueDate is included
    });

    // Save the task to the database
    await newTask.save();

    // Log the saved task for debugging
    console.log("Saved Task:", newTask);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ message: "Failed to create task", error: error.message }, { status: 500 });
  }
}

