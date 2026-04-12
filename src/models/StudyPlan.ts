import mongoose, { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 1 },
  resources: [{
    label: String,
    url: String,
  }],
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false },
  }],
  note: { type: String },
});

const StudyPlanSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String,
  },
  tasks: [TaskSchema],
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  category: { type: String },
}, { timestamps: true });

const StudyPlan = models.StudyPlan || model('StudyPlan', StudyPlanSchema);

export default StudyPlan;
