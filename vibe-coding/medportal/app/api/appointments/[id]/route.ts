import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: true, doctor: true }
    });
    if (!appointment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (
      ![Role.ADMIN, Role.DOCTOR, Role.NURSE].includes(user.role) &&
      appointment.patientId &&
      user.role === Role.PATIENT
    ) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (patient?.id !== appointment.patientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json(appointment);
  } catch (error) {
    return apiError(error, "Unable to fetch appointment");
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR, Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const appointment = await prisma.appointment.update({ where: { id: params.id }, data: body });
    return NextResponse.json(appointment);
  } catch (error) {
    return apiError(error, "Unable to update appointment");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.appointment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Unable to delete appointment");
  }
}
