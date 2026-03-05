import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: { user: true, appointments: true, prescriptions: true }
    });
    return NextResponse.json(patient);
  } catch (error) {
    return apiError(error, "Unable to fetch patient");
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const updated = await prisma.patient.update({ where: { id: params.id }, data: body });
    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Unable to update patient");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.patient.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete patient");
  }
}
