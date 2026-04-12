import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import StudyPlan from "@/models/StudyPlan";

// GET all study plans for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const plans = await StudyPlan.find({ userId: session.user.id }).sort({ createdAt: -1 });
    
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching plans" }, { status: 500 });
  }
}

// POST create a new study plan
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in API:", JSON.stringify(session, null, 2));
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description, tasks } = await req.json();
    
    await connectDB();
    const newPlan = await StudyPlan.create({
      userId: session.user.id,
      title,
      description,
      tasks: tasks || [],
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("POST /api/study-plans error:", error);
    return NextResponse.json({ message: "Error creating plan", error: String(error) }, { status: 500 });
  }
}
