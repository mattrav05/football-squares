import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Check if password is required and if user has access
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        accessPassword: true,
        managerId: true,
        players: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }

    const passwordRequired = !!game.accessPassword;
    const isManager = game.managerId === session.user.id;
    const isPlayer = game.players.length > 0;

    // Manager always has access
    // Existing players have access (they already entered the password before)
    const hasAccess = isManager || isPlayer;

    return NextResponse.json({
      passwordRequired,
      hasAccess,
    });
  } catch (error) {
    console.error("Error checking game access:", error);
    return NextResponse.json(
      { message: "Failed to check access" },
      { status: 500 }
    );
  }
}

// Verify password and grant access
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        accessPassword: true,
        managerId: true,
      },
    });

    if (!game) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }

    // Manager always has access
    if (game.managerId === session.user.id) {
      return NextResponse.json({ success: true });
    }

    // No password set means anyone can access
    if (!game.accessPassword) {
      return NextResponse.json({ success: true });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, game.accessPassword);

    if (!isValid) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying game password:", error);
    return NextResponse.json(
      { message: "Failed to verify password" },
      { status: 500 }
    );
  }
}
