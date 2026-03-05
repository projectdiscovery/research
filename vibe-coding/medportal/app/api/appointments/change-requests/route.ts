import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const change = await prisma.appointmentChangeRequest.create({
      data: {
        appointmentId: body.appointmentId,
        requestedByPatient: user.role === Role.PATIENT,
        requestedTime: new Date(body.requestedTime),
        status: "pending"
      }
    });
    return NextResponse.json(change, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to request change");
  }
}

export async function GET() {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const changes = await prisma.appointmentChangeRequest.findMany({ include: { appointment: true } });
    return NextResponse.json(changes);
  } catch (error) {
    return apiError(error, "Unable to load changes");
  }
}
