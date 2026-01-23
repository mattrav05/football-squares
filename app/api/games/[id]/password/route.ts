import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Set or update game password
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { enabled, password } = await request.json();

    // Verify user is the manager
    const game = await prisma.game.findUnique({
      where: { id, managerId: session.user.id },
      select: { id: true },
    });

    if (!game) {
      return NextResponse.json(
        { message: "Game not found or you are not the manager" },
        { status: 404 }
      );
    }

    if (enabled && password) {
      // Validate password
      if (password.length < 4) {
        return NextResponse.json(
          { message: "Password must be at least 4 characters" },
          { status: 400 }
        );
      }

      // Hash and save password
      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.game.update({
        where: { id },
        data: { accessPassword: hashedPassword },
      });

      return NextResponse.json({ message: "Password protection enabled" });
    } else {
      // Remove password protection
      await prisma.game.update({
        where: { id },
        data: { accessPassword: null },
      });

      return NextResponse.json({ message: "Password protection disabled" });
    }
  } catch (error) {
    console.error("Error updating game password:", error);
    return NextResponse.json(
      { message: "Failed to update password" },
      { status: 500 }
    );
  }
}
