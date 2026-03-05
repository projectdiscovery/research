import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR, Role.NURSE].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const patients = await prisma.patient.findMany({
      include: { user: true, primaryDoctor: { include: { user: true } } }
    });
    return NextResponse.json(patients);
  } catch (error) {
    return apiError(error, "Unable to fetch patients");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const created = await prisma.patient.create({
      data: body
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create patient");
  }
}
