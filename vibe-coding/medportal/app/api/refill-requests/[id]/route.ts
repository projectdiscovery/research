import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { RefillRequestStatus, Role } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const requestRecord = await prisma.prescriptionRefillRequest.update({
      where: { id: params.id },
      data: {
        status: body.status as RefillRequestStatus,
        denialReason: body.denialReason,
        decisionById: user.id,
        decidedAt: new Date()
      }
    });
    return NextResponse.json(requestRecord);
  } catch (error) {
    return apiError(error, "Unable to update refill request");
  }
}
