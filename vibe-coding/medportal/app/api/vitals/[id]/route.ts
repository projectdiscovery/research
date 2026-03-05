import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.NURSE, Role.DOCTOR].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const vital = await prisma.vital.update({ where: { id: params.id }, data: body });
    return NextResponse.json(vital);
  } catch (error) {
    return apiError(error, "Unable to update vital");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.NURSE, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.vital.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete vital");
  }
}
