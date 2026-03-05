import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { prescriptions: true } });
      return NextResponse.json(patient?.prescriptions ?? []);
    }
    if (![Role.DOCTOR, Role.NURSE, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const prescriptions = await prisma.prescription.findMany({ include: { patient: true } });
    return NextResponse.json(prescriptions);
  } catch (error) {
    return apiError(error, "Unable to fetch prescriptions");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.NURSE, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const prescription = await prisma.prescription.create({ data: body });
    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create prescription");
  }
}
