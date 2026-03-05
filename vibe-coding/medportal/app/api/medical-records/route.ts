import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { medicalRecords: true } });
      return NextResponse.json(patient?.medicalRecords ?? []);
    }
    if (![Role.ADMIN, Role.DOCTOR, Role.NURSE].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const records = await prisma.medicalRecord.findMany({ include: { patient: true, doctor: true } });
    return NextResponse.json(records);
  } catch (error) {
    return apiError(error, "Unable to fetch records");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.NURSE, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const record = await prisma.medicalRecord.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create record");
  }
}
