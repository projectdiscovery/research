import {
  PrismaClient,
  AppointmentStatus,
  AuditAction,
  BulkImportStatus,
  LabOrderStatus,
  LabResultStatus,
  NotificationType,
  RefillRequestStatus,
  ReferralStatus,
  Role,
  ShareLinkStatus,
  WaitlistStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.medicalShareLink.deleteMany();
  await prisma.prescriptionRefillRequest.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.labAttachment.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.doctorAvailabilityBlock.deleteMany();
  await prisma.appointmentChangeRequest.deleteMany();
  await prisma.appointmentWaitlist.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.labTechnician.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.bulkImportJob.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const departments = await prisma.$transaction([
    prisma.department.create({
      data: { name: "Metabolic Health", description: "Endocrinology and metabolic disorders" }
    }),
    prisma.department.create({ data: { name: "Neuroscience", description: "Neurology clinic" } }),
    prisma.department.create({ data: { name: "Heart Institute", description: "Cardiology and imaging" } }),
    prisma.department.create({ data: { name: "Diagnostics Lab", description: "Laboratory services" } })
  ]);

  const [metabolic, neurologyDept, cardiology, diagnostics] = departments;

  const passwords = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("doctor123", 10),
    bcrypt.hash("doctorlee123", 10),
    bcrypt.hash("nurse123", 10),
    bcrypt.hash("lab123", 10),
    bcrypt.hash("patient123", 10)
  ]);

  const [adminPassword, doctorPassword, doctorLeePassword, nursePassword, labPassword, patientPassword] = passwords;

  const adminUser = await prisma.user.create({
    data: {
      name: "Evelyn Wright",
      email: "admin@medportal.com",
      password: adminPassword,
      role: Role.ADMIN,
      adminProfile: { create: { permissions: ["manage_users", "override_appointments", "view_analytics"] } }
    },
    include: { adminProfile: true }
  });

  const doctorUser = await prisma.user.create({
    data: {
      name: "Dr. Maya Patel",
      email: "dr.patel@medportal.com",
      password: doctorPassword,
      role: Role.DOCTOR,
      doctorProfile: {
        create: {
          specialty: "Endocrinology",
          bio: "Focuses on chronic condition management and lifestyle medicine.",
          departmentId: metabolic.id,
          availability: {
            weekly: [
              { day: "Monday", slots: ["09:00", "13:00"] },
              { day: "Wednesday", slots: ["10:00", "15:00"] },
              { day: "Friday", slots: ["09:30", "12:30"] }
            ]
          }
        }
      }
    },
    include: { doctorProfile: true }
  });

  const doctorLeeUser = await prisma.user.create({
    data: {
      name: "Dr. Marcus Lee",
      email: "dr.lee@medportal.com",
      password: doctorLeePassword,
      role: Role.DOCTOR,
      doctorProfile: {
        create: {
          specialty: "Neurology",
          departmentId: neurologyDept.id,
          bio: "Neurologist specializing in migraine care",
          availability: { weekly: [{ day: "Tuesday", slots: ["10:00", "14:00"] }] }
        }
      }
    },
    include: { doctorProfile: true }
  });

  const nurseUser = await prisma.user.create({
    data: {
      name: "Nurse Jordan James",
      email: "nurse.james@medportal.com",
      password: nursePassword,
      role: Role.NURSE,
      nurseProfile: {
        create: {
          departmentId: metabolic.id,
          title: "RN Care Coordinator"
        }
      }
    },
    include: { nurseProfile: true }
  });

  const labTechUser = await prisma.user.create({
    data: {
      name: "Tara Snow",
      email: "lab.snow@medportal.com",
      password: labPassword,
      role: Role.LAB_TECH,
      labTechProfile: {
        create: {
          departmentId: diagnostics.id
        }
      }
    },
    include: { labTechProfile: true }
  });

  const patientUser = await prisma.user.create({
    data: {
      name: "Avery Johnson",
      email: "avery.johnson@medportal.com",
      password: patientPassword,
      role: Role.PATIENT,
      patientProfile: {
        create: {
          firstName: "Avery",
          lastName: "Johnson",
          email: "avery.johnson@medportal.com",
          phone: "+1-555-234-9910",
          dateOfBirth: new Date("1988-07-14"),
          gender: "Female",
          city: "Seattle",
          state: "WA",
          postalCode: "98104",
          medicalHistory: ["Type 2 Diabetes", "Migraine"],
          allergies: ["Penicillin"],
          insuranceProvider: "Blue Horizon Health",
          insurancePlanNumber: "BH-72922-01",
          insuranceGroupNumber: "GH-77A",
          insurancePhone: "800-555-0111",
          emergencyContact: "Jordan Johnson",
          emergencyPhone: "+1-555-882-4020",
          primaryDoctorId: doctorUser.doctorProfile!.id
        }
      }
    },
    include: { patientProfile: true }
  });

  const patient = patientUser.patientProfile!;
  const drPatel = doctorUser.doctorProfile!;
  const drLee = doctorLeeUser.doctorProfile!;
  const nurse = nurseUser.nurseProfile!;
  const labTech = labTechUser.labTechProfile!;

  const appointmentParent = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: drPatel.id,
      department: "Endocrinology",
      reason: "Diabetes follow-up",
      status: AppointmentStatus.SCHEDULED,
      appointmentDate: new Date("2024-05-02T09:30:00Z"),
      location: "Wellness Tower - Level 4",
      recurrenceRule: "FREQ=MONTHLY;COUNT=3"
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: drLee.id,
      department: "Neurology",
      reason: "Migraine management",
      status: AppointmentStatus.COMPLETED,
      appointmentDate: new Date("2024-03-18T14:00:00Z"),
      location: "Neuro Center - Level 3"
    }
  });

  await prisma.appointmentWaitlist.create({
    data: {
      patientId: patient.id,
      doctorId: drPatel.id,
      desiredDate: new Date("2024-04-08T11:15:00Z"),
      status: WaitlistStatus.WAITING,
      notes: "Prefers morning slots"
    }
  });

  await prisma.appointmentChangeRequest.create({
    data: {
      appointmentId: appointmentParent.id,
      requestedByPatient: true,
      requestedTime: new Date("2024-05-03T10:00:00Z"),
      status: "pending"
    }
  });

  await prisma.doctorAvailabilityBlock.create({
    data: {
      doctorId: drPatel.id,
      startTime: new Date("2024-05-10T13:00:00Z"),
      endTime: new Date("2024-05-10T17:00:00Z"),
      reason: "Conference"
    }
  });

  await prisma.medicalRecord.createMany({
    data: [
      {
        patientId: patient.id,
        doctorId: drPatel.id,
        title: "Annual Wellness Exam",
        department: "Primary Care",
        summary: "Vitals stable. A1C improved to 6.8%. Continue current care plan.",
        visitDate: new Date("2023-11-04T10:00:00Z")
      },
      {
        patientId: patient.id,
        doctorId: drLee.id,
        title: "Neurology Consult",
        department: "Neurology",
        summary: "Migraine frequency reduced. Adjust preventative medication dosage.",
        visitDate: new Date("2023-09-17T13:00:00Z")
      }
    ]
  });

  const prescriptions = await prisma.$transaction([
    prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: drPatel.id,
        medication: "Metformin",
        dosage: "500 mg",
        frequency: "Twice daily",
        instructions: "Take with meals",
        startDate: new Date("2023-01-01T00:00:00Z"),
        refills: 3,
        refillsRemaining: 1,
        expiresOn: new Date("2024-12-31T00:00:00Z")
      }
    }),
    prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: drLee.id,
        medication: "Sumatriptan",
        dosage: "50 mg",
        frequency: "As needed",
        instructions: "Take at migraine onset",
        startDate: new Date("2022-05-12T00:00:00Z"),
        refills: 2,
        refillsRemaining: 2
      }
    })
  ]);

  const [metformin] = prescriptions;

  const refillRequest = await prisma.prescriptionRefillRequest.create({
    data: {
      prescriptionId: metformin.id,
      patientId: patient.id,
      doctorId: drPatel.id,
      requestedById: patientUser.id,
      message: "Need refill before traveling",
      status: RefillRequestStatus.PENDING
    }
  });

  const labOrder = await prisma.labOrder.create({
    data: {
      patientId: patient.id,
      doctorId: drPatel.id,
      technicianId: labTech.id,
      testName: "HbA1c",
      priority: "Routine",
      status: LabOrderStatus.IN_PROGRESS,
      notes: "Quarterly monitoring"
    }
  });

  const labResult = await prisma.labResult.create({
    data: {
      patientId: patient.id,
      doctorId: drPatel.id,
      labOrderId: labOrder.id,
      testName: "HbA1c",
      resultDate: new Date("2023-10-20T00:00:00Z"),
      resultSummary: "A1C measured 7.2%. Continue monitoring and nutrition plan.",
      status: LabResultStatus.PENDING_REVIEW,
      value: "7.2%",
      referenceRange: "4.0 - 5.6%"
    }
  });

  await prisma.labAttachment.create({
    data: {
      labResultId: labResult.id,
      technicianId: labTech.id,
      fileName: "hba1c-october.pdf",
      fileType: "application/pdf",
      fileUrl: "/uploads/labs/hba1c-october.pdf"
    }
  });

  await prisma.vital.create({
    data: {
      patientId: patient.id,
      nurseId: nurse.id,
      heartRate: 72,
      bloodPressure: "118/76",
      temperature: 98.6,
      respiratoryRate: 16,
      notes: "Patient reports feeling well."
    }
  });

  await prisma.referral.create({
    data: {
      patientId: patient.id,
      fromDoctorId: drPatel.id,
      toDoctorId: drLee.id,
      status: ReferralStatus.PENDING,
      reason: "Neurology evaluation",
      notes: "Review migraine protocol",
      expiresAt: new Date("2024-06-30T00:00:00Z")
    }
  });

  await prisma.medicalShareLink.create({
    data: {
      patientId: patient.id,
      token: "share-demo-token",
      status: ShareLinkStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: patientUser.id,
        type: NotificationType.APPOINTMENT,
        title: "Appointment reminder",
        description: "Cardiology visit tomorrow at 11:15 AM",
        link: "/dashboard/appointments"
      },
      {
        userId: patientUser.id,
        type: NotificationType.PRESCRIPTION,
        title: "Refill requested",
        description: "Metformin refill pending approval",
        link: "/dashboard/prescriptions"
      },
      {
        userId: doctorUser.id,
        type: NotificationType.REFERRAL,
        title: "New referral",
        description: "Review neurology referral for Avery",
        link: "/dashboard/records"
      }
    ]
  });

  await prisma.message.create({
    data: {
      senderId: patientUser.id,
      recipientId: doctorUser.id,
      patientId: patient.id,
      doctorId: drPatel.id,
      content: "Hi Dr. Patel, should I adjust my medication before the next visit?"
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: doctorUser.id,
        patientId: patient.id,
        action: AuditAction.VIEW_RECORD,
        resourceType: "medical_record",
        resourceId: "mr01",
        details: { note: "Viewed neurology consult" }
      },
      {
        userId: adminUser.id,
        patientId: patient.id,
        action: AuditAction.SHARE_LINK,
        resourceType: "share_link",
        resourceId: "share-demo-token",
        details: { destination: "External provider" }
      }
    ]
  });

  await prisma.bulkImportJob.create({
    data: {
      adminId: adminUser.adminProfile!.id,
      fileName: "patients-march.csv",
      status: BulkImportStatus.PROCESSING,
      totalRows: 150,
      processedRows: 40,
      errorReport: { rowsWithErrors: [12, 39] }
    }
  });

  await prisma.notification.create({
    data: {
      userId: patientUser.id,
      type: NotificationType.LAB_RESULT,
      title: "Lab result uploaded",
      description: "HbA1c ready for review",
      link: "/dashboard/records"
    }
  });

  await prisma.prescriptionRefillRequest.update({
    where: { id: refillRequest.id },
    data: {
      status: RefillRequestStatus.APPROVED,
      decisionById: doctorUser.id,
      decidedAt: new Date(),
      doctorId: drPatel.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
