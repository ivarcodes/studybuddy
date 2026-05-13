import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.isGuest) {
      return NextResponse.json(
        { error: "Not a guest user" },
        { status: 400 }
      );
    }

    await User.deleteOne({ email: session.user.email });

    return NextResponse.json(
      { message: "Guest account deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Guest deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete guest user" },
      { status: 500 }
    );
  }
}