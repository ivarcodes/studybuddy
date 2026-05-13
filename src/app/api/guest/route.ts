import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    await connectDB();

    const guestNumber = Math.floor(Math.random() * 1000000);
    const guestEmail = `guest${guestNumber}@studybuddy.demo`;
    const plainPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const existingGuest = await User.findOne({ email: guestEmail });
    if (existingGuest) {
      const userWithoutPassword = existingGuest.toObject();
      delete (userWithoutPassword as any).password;
      return NextResponse.json(
        { user: userWithoutPassword, password: plainPassword },
        { status: 200 }
      );
    }

    const guestUser = await User.create({
      email: guestEmail,
      password: hashedPassword,
      name: `Guest User ${guestNumber}`,
      role: 'guest',
      isGuest: true,
    });

    const userWithoutPassword = guestUser.toObject();
    delete (userWithoutPassword as any).password;

    return NextResponse.json(
      { user: userWithoutPassword, password: plainPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Guest creation error:", error);
    return NextResponse.json(
      { error: "Failed to create guest user" },
      { status: 500 }
    );
  }
}