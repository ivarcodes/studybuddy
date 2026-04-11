import mongoose, { Schema, model, models } from 'mongoose';

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
  tasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
  }],
  aiGenerated: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const StudyPlan = models.StudyPlan || model('StudyPlan', StudyPlanSchema);

export default StudyPlan;
