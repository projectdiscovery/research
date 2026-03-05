import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const existing = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: body
    });
    return NextResponse.json(notification);
  } catch (error) {
    return apiError(error, "Unable to update notification");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    await prisma.notification.deleteMany({ where: { id: params.id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete notification");
  }
}
