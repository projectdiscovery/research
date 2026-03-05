import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { vitals: true } });
      return NextResponse.json(patient?.vitals ?? []);
    }
    if (![Role.NURSE, Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const vitals = await prisma.vital.findMany({ include: { patient: true, nurse: true } });
    return NextResponse.json(vitals);
  } catch (error) {
    return apiError(error, "Unable to fetch vitals");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.NURSE, Role.DOCTOR].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const vital = await prisma.vital.create({ data: body });
    return NextResponse.json(vital, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create vital");
  }
}
