import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import StudyPlan from "@/models/StudyPlan";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const plan = await StudyPlan.findOne({ _id: id, userId: session.user.id });

    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching plan" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    await connectDB();

    const setFields: Record<string, any> = {};
    if (updates.tasks !== undefined) setFields.tasks = updates.tasks;
    if (updates.title !== undefined) setFields.title = updates.title;

    const updated = await StudyPlan.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: setFields },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(updated.toObject());
  } catch (error: any) {
    console.error("PUT Route Crash:", error.message);
    return NextResponse.json({ message: error.message || "Error updating plan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const deletedPlan = await StudyPlan.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!deletedPlan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Plan deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting plan" }, { status: 500 });
  }
}
