import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('No MongoDB URI Found');
}



async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI!)
    console.log("connected to db")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }

}

export default connectDB;
