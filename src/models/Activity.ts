import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["task_completion", "plan_creation", "study_session"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
  }
});

export default mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
