import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const logs = await prisma.auditLog.findMany({ include: { user: true, patient: true }, orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json(logs);
  } catch (error) {
    return apiError(error, "Unable to fetch audit logs");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const log = await prisma.auditLog.create({
      data: {
        userId: user.id,
        patientId: body.patientId,
        action: body.action,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        details: body.details
      }
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to write audit log");
  }
}
