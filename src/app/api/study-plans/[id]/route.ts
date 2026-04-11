import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import StudyPlan from "@/models/StudyPlan";

// GET a single study plan
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const plan = await StudyPlan.findOne({ _id: params.id, userId: session.user.id });
    
    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching plan" }, { status: 500 });
  }
}

// PUT update a study plan
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    await connectDB();
    
    const updatedPlan = await StudyPlan.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      updates,
      { new: true }
    );

    if (!updatedPlan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    return NextResponse.json({ message: "Error updating plan" }, { status: 500 });
  }
}

// DELETE a study plan
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const deletedPlan = await StudyPlan.findOneAndDelete({ _id: params.id, userId: session.user.id });

    if (!deletedPlan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Plan deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting plan" }, { status: 500 });
  }
}
