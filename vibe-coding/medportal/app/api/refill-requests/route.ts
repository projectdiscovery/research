import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { RefillRequestStatus, Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { refillRequests: true } });
      return NextResponse.json(patient?.refillRequests ?? []);
    }
    if (![Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const requests = await prisma.prescriptionRefillRequest.findMany({ include: { prescription: true, patient: true } });
    return NextResponse.json(requests);
  } catch (error) {
    return apiError(error, "Unable to fetch refill requests");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.PATIENT].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    const requestRecord = await prisma.prescriptionRefillRequest.create({
      data: {
        prescriptionId: body.prescriptionId,
        patientId: patient?.id ?? body.patientId,
        doctorId: body.doctorId,
        requestedById: user.id,
        message: body.message,
        status: RefillRequestStatus.PENDING
      }
    });
    return NextResponse.json(requestRecord, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create refill request");
  }
}
