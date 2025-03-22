import dbConnect from "@/app/lib/dbConnect";
import Task from "@/app/models/Task";
import { NextResponse } from "next/server";

// GET: Fetch a single task by ID
export async function GET(req, context) {
    await dbConnect();
    try {
        const params = await context.params; 
        const task = await Task.findById(params.id);

        if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

        return NextResponse.json(task, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching task", error: error.message }, { status: 500 });
    }
}

// PATCH: Update a task's status
export async function PATCH(req, context) {
    await dbConnect();
    try {
        const params = await context.params; 
        const { status, prevStatus, dueDate } = await req.json();

        const updatedTask = await Task.findByIdAndUpdate(
            params.id,
            { status, prevStatus, dueDate },
            { new: true }
        );

        if (!updatedTask) return NextResponse.json({ message: "Task not found" }, { status: 404 });

        return NextResponse.json(updatedTask, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating task status", error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a task
export async function DELETE(req, context) {
    await dbConnect();
    try {
        const params = await context.params; 
        const deletedTask = await Task.findByIdAndDelete(params.id);

        if (!deletedTask) return NextResponse.json({ message: "Task not found" }, { status: 404 });

        return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting task", error: error.message }, { status: 500 });
    }
}
