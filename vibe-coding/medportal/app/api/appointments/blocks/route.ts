import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.DOCTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id }, include: { blockedSlots: true } });
    return NextResponse.json(doctor?.blockedSlots ?? []);
  } catch (error) {
    return apiError(error, "Unable to fetch blocks");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.DOCTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    const body = await request.json();
    const block = await prisma.doctorAvailabilityBlock.create({
      data: {
        doctorId: doctor?.id ?? body.doctorId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        reason: body.reason
      }
    });
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save block");
  }
}
