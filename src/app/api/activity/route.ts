import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Activity from "@/models/Activity";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { type, planId } = await req.json();
    await connectDB();

    const activity = await Activity.create({
      userId: session.user.id,
      type,
      planId,
    });

    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json({ message: "Failed to log activity" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const activities = await Activity.find({ userId: session.user.id }).sort({ date: 1 });

    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch activities" }, { status: 500 });
  }
}
