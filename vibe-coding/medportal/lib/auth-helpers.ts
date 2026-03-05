import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, User } from "@prisma/client";

export async function requireAuth(): Promise<User & { role: Role }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export function hasRole(userRole: Role, allowed: Role[]) {
  return allowed.includes(userRole);
}

export function apiError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
