import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
