import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    await requireAuth();
    const departments = await prisma.department.findMany({ include: { doctors: true, nurses: true } });
    return NextResponse.json(departments);
  } catch (error) {
    return apiError(error, "Unable to fetch departments");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const department = await prisma.department.create({ data: body });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create department");
  }
}
