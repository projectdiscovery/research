import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    return apiError(error, "Unable to fetch users");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const password = await bcrypt.hash(body.password ?? "changeme123", 10);
    const created = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password,
        role: body.role ?? Role.PATIENT
      }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create user");
  }
}
