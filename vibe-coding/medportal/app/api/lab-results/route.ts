import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { labResults: true } });
      return NextResponse.json(patient?.labResults ?? []);
    }
    if (![Role.DOCTOR, Role.LAB_TECH, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const results = await prisma.labResult.findMany({ include: { patient: true } });
    return NextResponse.json(results);
  } catch (error) {
    return apiError(error, "Unable to fetch lab results");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.LAB_TECH].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const result = await prisma.labResult.create({ data: body });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create lab result");
  }
}
