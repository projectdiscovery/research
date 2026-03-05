import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR, Role.LAB_TECH].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const orders = await prisma.labOrder.findMany({ include: { patient: true, doctor: true, technician: true } });
    return NextResponse.json(orders);
  } catch (error) {
    return apiError(error, "Unable to fetch lab orders");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.DOCTOR, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const order = await prisma.labOrder.create({ data: body });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create lab order");
  }
}
