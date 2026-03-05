import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const existing = await prisma.message.findUnique({ where: { id: params.id } });
    if (!existing || (existing.recipientId !== user.id && existing.senderId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const message = await prisma.message.update({ where: { id: params.id }, data: body });
    return NextResponse.json(message);
  } catch (error) {
    return apiError(error, "Unable to update message");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    await prisma.message.deleteMany({ where: { id: params.id, senderId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete message");
  }
}
