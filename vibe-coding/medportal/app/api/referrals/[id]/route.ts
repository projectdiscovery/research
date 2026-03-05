import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        fromDoctor: { include: { user: true } },
        toDoctor: { include: { user: true } }
      }
    });
    return NextResponse.json(referral);
  } catch (error) {
    return apiError(error, "Unable to fetch referral");
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const referral = await prisma.referral.update({ where: { id: params.id }, data: body });
    return NextResponse.json(referral);
  } catch (error) {
    return apiError(error, "Unable to update referral");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.referral.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete referral");
  }
}
