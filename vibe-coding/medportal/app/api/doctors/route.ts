import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doctors = await prisma.doctor.findMany({ include: { user: true, department: true } });
    return NextResponse.json(doctors);
  } catch (error) {
    return apiError(error, "Unable to fetch doctors");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const doctor = await prisma.doctor.create({ data: body });
    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create doctor");
  }
}
