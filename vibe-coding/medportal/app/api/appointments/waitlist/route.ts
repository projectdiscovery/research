import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role, WaitlistStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { waitlistEntries: true } });
      return NextResponse.json(patient?.waitlistEntries ?? []);
    }
    const entries = await prisma.appointmentWaitlist.findMany({ include: { patient: true, doctor: true } });
    return NextResponse.json(entries);
  } catch (error) {
    return apiError(error, "Unable to fetch waitlist");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const patient = user.role === Role.PATIENT ? await prisma.patient.findUnique({ where: { userId: user.id } }) : null;
    const entry = await prisma.appointmentWaitlist.create({
      data: {
        patientId: patient?.id ?? body.patientId,
        doctorId: body.doctorId,
        desiredDate: new Date(body.desiredDate),
        notes: body.notes,
        status: WaitlistStatus.WAITING
      }
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create waitlist entry");
  }
}
