import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { LabResultStatus, Role } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.LAB_TECH, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const technician = await prisma.labTechnician.findUnique({ where: { userId: user.id } });
    const labResult = await prisma.labResult.update({
      where: { id: body.labResultId },
      data: {
        status: body.markCompleted ? LabResultStatus.PENDING_REVIEW : undefined,
        attachmentUrl: body.fileUrl ?? undefined
      }
    });
    await prisma.labAttachment.create({
      data: {
        labResultId: labResult.id,
        technicianId: technician?.id ?? body.technicianId,
        fileName: body.fileName,
        fileType: body.fileType ?? "application/pdf",
        fileUrl: body.fileUrl ?? `/uploads/${body.fileName}`
      }
    });
    return NextResponse.json(labResult);
  } catch (error) {
    return apiError(error, "Unable to upload lab result");
  }
}
