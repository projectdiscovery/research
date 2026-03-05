import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const filter = searchParams.get("type") ?? "all";

    const results: Array<{ id: string; label: string; type: string; meta: string }> = [];

    if (filter === "all" || filter === "patient") {
      const patients = await prisma.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      });
      patients.forEach((patient) => {
        results.push({ id: patient.id, label: `${patient.firstName} ${patient.lastName}`, type: "patient", meta: patient.city ?? "" });
      });
    }

    if (filter === "all" || filter === "doctor") {
      const doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { specialty: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { user: true },
        take: 5
      });
      doctors.forEach((doctor) => {
        results.push({ id: doctor.id, label: doctor.user.name, type: "doctor", meta: doctor.specialty });
      });
    }

    if (filter === "all" || filter === "record") {
      const records = await prisma.medicalRecord.findMany({
        where: { title: { contains: query, mode: "insensitive" } },
        include: { patient: true },
        take: 5
      });
      records.forEach((record) => {
        results.push({ id: record.id, label: record.title, type: "record", meta: `Patient: ${record.patient.firstName} ${record.patient.lastName}` });
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    return apiError(error, "Unable to run search");
  }
}
