import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { BulkImportStatus, Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const jobs = await prisma.bulkImportJob.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(jobs);
  } catch (error) {
    return apiError(error, "Unable to fetch imports");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const admin = await prisma.adminProfile.findUnique({ where: { userId: user.id } });
    const job = await prisma.bulkImportJob.create({
      data: {
        adminId: admin?.id ?? body.adminId,
        fileName: body.fileName,
        status: body.status ?? BulkImportStatus.PENDING,
        totalRows: body.totalRows
      }
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create import job");
  }
}
