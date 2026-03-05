import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role, ShareLinkStatus } from "@prisma/client";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { shareLinks: true } });
      return NextResponse.json(patient?.shareLinks ?? []);
    }
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const links = await prisma.medicalShareLink.findMany({ include: { patient: true } });
    return NextResponse.json(links);
  } catch (error) {
    return apiError(error, "Unable to fetch share links");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.PATIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    const body = await request.json();
    const link = await prisma.medicalShareLink.create({
      data: {
        patientId: patient?.id ?? body.patientId,
        token: randomBytes(12).toString("hex"),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: ShareLinkStatus.ACTIVE
      }
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create share link");
  }
}
