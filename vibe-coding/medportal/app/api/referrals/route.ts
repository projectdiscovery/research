import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role, ReferralStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const referrals = await prisma.referral.findMany({
      include: {
        patient: true,
        fromDoctor: { include: { user: true } },
        toDoctor: { include: { user: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(referrals);
  } catch (error) {
    return apiError(error, "Unable to fetch referrals");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.DOCTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    const referral = await prisma.referral.create({
      data: {
        patientId: body.patientId,
        fromDoctorId: doctor?.id ?? body.fromDoctorId,
        toDoctorId: body.toDoctorId,
        reason: body.reason,
        notes: body.notes,
        status: body.status ?? ReferralStatus.PENDING,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
      }
    });
    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create referral");
  }
}
