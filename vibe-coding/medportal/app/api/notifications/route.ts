import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { NotificationType, Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(notifications);
  } catch (error) {
    return apiError(error, "Unable to fetch notifications");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (![Role.ADMIN, Role.DOCTOR, Role.LAB_TECH].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        title: body.title,
        description: body.description,
        type: body.type ?? NotificationType.SYSTEM,
        link: body.link
      }
    });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create notification");
  }
}
