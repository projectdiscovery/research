import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role, ShareLinkStatus } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (![Role.PATIENT, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const link = await prisma.medicalShareLink.update({
      where: { id: params.id },
      data: {
        status: body.status as ShareLinkStatus,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
      }
    });
    return NextResponse.json(link);
  } catch (error) {
    return apiError(error, "Unable to update share link");
  }
}
