import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const game = await prisma.game.findFirst({
      where: {
        id,
        OR: [
          { managerId: session.user.id },
          { players: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        manager: { select: { id: true, name: true } },
        squares: {
          include: {
            player: { select: { id: true, name: true } },
          },
        },
        players: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { message: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify user is the manager
    const game = await prisma.game.findUnique({
      where: { id, managerId: session.user.id },
    });

    if (!game) {
      return NextResponse.json(
        { message: "Game not found or you are not the manager" },
        { status: 404 }
      );
    }

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        name: body.name,
        pricePerSquare: body.pricePerSquare,
        maxSquaresPerPlayer: body.maxSquaresPerPlayer,
        colorPrimary: body.colorPrimary,
        colorSecondary: body.colorSecondary,
        status: body.status,
      },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json(
      { message: "Failed to update game" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify user is the manager
    const game = await prisma.game.findUnique({
      where: { id, managerId: session.user.id },
    });

    if (!game) {
      return NextResponse.json(
        { message: "Game not found or you are not the manager" },
        { status: 404 }
      );
    }

    await prisma.game.delete({ where: { id } });

    return NextResponse.json({ message: "Game deleted" });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { message: "Failed to delete game" },
      { status: 500 }
    );
  }
}
