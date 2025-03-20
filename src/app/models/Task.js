import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        project: { type: String, required: true },
        status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
        prevStatus: { type: String, default: null }, // Store previous status for undo
        currentStatus: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" }, // Store the current status
      },
      { timestamps: true }
);

const Task = mongoose.models.tasks || mongoose.model("tasks", TaskSchema);
export default Task;
