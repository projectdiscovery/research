import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await requireAuth();
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(messages);
  } catch (error) {
    return apiError(error, "Unable to fetch messages");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: body.recipientId,
        patientId: body.patientId,
        doctorId: body.doctorId,
        content: body.content
      }
    });
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to send message");
  }
}
