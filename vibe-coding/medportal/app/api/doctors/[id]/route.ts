import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR, Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: true, patients: true }
    });
    return NextResponse.json(doctor);
  } catch (error) {
    return apiError(error, "Unable to fetch doctor");
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const doctor = await prisma.doctor.update({ where: { id: params.id }, data: body });
    return NextResponse.json(doctor);
  } catch (error) {
    return apiError(error, "Unable to update doctor");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.doctor.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete doctor");
  }
}
