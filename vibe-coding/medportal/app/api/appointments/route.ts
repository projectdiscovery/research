import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { appointments: true } });
      return NextResponse.json(patient?.appointments ?? []);
    }
    if (user.role === Role.DOCTOR) {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id }, include: { appointments: true } });
      return NextResponse.json(doctor?.appointments ?? []);
    }
    if (![Role.ADMIN, Role.NURSE].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const appointments = await prisma.appointment.findMany({ include: { patient: true, doctor: true } });
    return NextResponse.json(appointments);
  } catch (error) {
    return apiError(error, "Unable to fetch appointments");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.PATIENT, Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const appointment = await prisma.appointment.create({ data: body });
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create appointment");
  }
}
