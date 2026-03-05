export type UserRole = "PATIENT" | "DOCTOR" | "NURSE" | "LAB_TECH" | "ADMIN";

export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  insuranceProvider: string;
  insuranceNumber: string;
  medicalHistory: string[];
  allergies: string[];
  primaryDoctor: string;
};

export type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  location: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  availability: string[];
  department: string;
};

export type MedicalRecord = {
  id: string;
  title: string;
  date: string;
  department: string;
  summary: string;
};

export type Prescription = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
};

export type LabResult = {
  id: string;
  test: string;
  date: string;
  status: "normal" | "attention" | "critical";
  summary: string;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  category: "appointment" | "lab" | "prescription" | "message" | "system";
  date: string;
  read: boolean;
};

export type ReferralSummary = {
  id: string;
  patient: string;
  fromDoctor: string;
  toDoctor: string;
  status: "pending" | "accepted" | "completed" | "declined";
  notes: string;
};

export type RefillRequest = {
  id: string;
  medication: string;
  requestedOn: string;
  status: "pending" | "approved" | "denied";
  message?: string;
  denialReason?: string;
};

export type MessageThread = {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  timestamp: string;
};

export type DoctorPatientSummary = {
  id: string;
  name: string;
  condition: string;
  lastVisit: string;
  nextStep: string;
};

export type VitalEntry = {
  id: string;
  patient: string;
  department: string;
  heartRate: number;
  bloodPressure: string;
  temperature: string;
  recordedAt: string;
};

export type LabOrder = {
  id: string;
  patient: string;
  test: string;
  status: "pending" | "in-progress" | "completed";
  priority: "routine" | "stat";
  assignedTo?: string;
};

export type WaitlistEntry = {
  id: string;
  patient: string;
  doctor?: string;
  preferredDate: string;
  status: "waiting" | "offered" | "booked";
};

export type AdminMetric = {
  label: string;
  value: string;
  trend: string;
};

export type BulkImportJobSummary = {
  id: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  processed: string;
  errors?: string;
};

export type ShareLink = {
  id: string;
  url: string;
  expires: string;
  status: "active" | "expired" | "revoked";
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
};

export type GlobalSearchResult = {
  id: string;
  label: string;
  type: "patient" | "doctor" | "record";
  meta: string;
};

export const demoCredentials = [
  { role: "Patient", email: "avery.johnson@medportal.com", password: "patient123" },
  { role: "Doctor", email: "dr.patel@medportal.com", password: "doctor123" },
  { role: "Nurse", email: "nurse.james@medportal.com", password: "nurse123" },
  { role: "Lab Tech", email: "lab.snow@medportal.com", password: "lab123" },
  { role: "Admin", email: "admin@medportal.com", password: "admin123" }
];

export const patientProfile: Patient = {
  id: "p001",
  name: "Avery Johnson",
  email: "avery.johnson@medportal.com",
  phone: "+1 (555) 234-9910",
  dateOfBirth: "1988-07-14",
  insuranceProvider: "Blue Horizon Health",
  insuranceNumber: "BH-72922-01",
  medicalHistory: ["Type 2 Diabetes", "Migraine"],
  allergies: ["Penicillin"],
  primaryDoctor: "Dr. Maya Patel"
};

export const appointments: Appointment[] = [
  {
    id: "a01",
    doctor: "Dr. Maya Patel",
    specialty: "Endocrinology",
    date: "2024-05-02",
    time: "9:30 AM",
    status: "scheduled",
    location: "Wellness Tower, Level 4"
  },
  {
    id: "a02",
    doctor: "Dr. Marcus Lee",
    specialty: "Neurology",
    date: "2024-03-18",
    time: "2:00 PM",
    status: "completed",
    location: "Neurology Center, Level 3"
  },
  {
    id: "a03",
    doctor: "Dr. Simone Alvarez",
    specialty: "Cardiology",
    date: "2024-04-08",
    time: "11:15 AM",
    status: "scheduled",
    location: "Heart Institute, Level 2"
  }
];

export const medicalRecords: MedicalRecord[] = [
  {
    id: "mr01",
    title: "Annual Wellness Exam",
    date: "2023-11-04",
    department: "Primary Care",
    summary: "Routine wellness visit. Vital signs stable; A1C improved to 6.8%."
  },
  {
    id: "mr02",
    title: "Neurology Consult",
    date: "2023-09-17",
    department: "Neurology",
    summary: "Migraine frequency reduced. Adjusted preventative medication dosage."
  },
  {
    id: "mr03",
    title: "Lab Review",
    date: "2023-08-02",
    department: "Endocrinology",
    summary: "Discussed fasting glucose trends and nutrition plan updates."
  }
];

export const prescriptions: Prescription[] = [
  {
    id: "rx01",
    medication: "Metformin",
    dosage: "500 mg",
    frequency: "Twice daily",
    prescribedBy: "Dr. Maya Patel",
    startDate: "2023-01-01"
  },
  {
    id: "rx02",
    medication: "Sumatriptan",
    dosage: "50 mg",
    frequency: "As needed for migraine",
    prescribedBy: "Dr. Marcus Lee",
    startDate: "2022-05-12"
  },
  {
    id: "rx03",
    medication: "Vitamin D3",
    dosage: "2000 IU",
    frequency: "Daily",
    prescribedBy: "Dr. Maya Patel",
    startDate: "2023-03-01"
  }
];

export const labResults: LabResult[] = [
  {
    id: "lab01",
    test: "HbA1c",
    date: "2023-10-20",
    status: "attention",
    summary: "A1C measured 7.2%. Continue monitoring and dietary plan."
  },
  {
    id: "lab02",
    test: "Complete Blood Count",
    date: "2023-09-02",
    status: "normal",
    summary: "All values within normal ranges."
  },
  {
    id: "lab03",
    test: "Lipid Panel",
    date: "2023-06-11",
    status: "normal",
    summary: "HDL improved, LDL steady at 92 mg/dL."
  }
];

export const doctors: Doctor[] = [
  {
    id: "d01",
    name: "Dr. Maya Patel",
    specialty: "Endocrinology",
    department: "Metabolic Health",
    availability: ["Mon 9:00 AM", "Wed 1:00 PM", "Fri 10:30 AM"]
  },
  {
    id: "d02",
    name: "Dr. Marcus Lee",
    specialty: "Neurology",
    department: "Neuroscience",
    availability: ["Tue 10:00 AM", "Thu 2:30 PM"]
  },
  {
    id: "d03",
    name: "Dr. Simone Alvarez",
    specialty: "Cardiology",
    department: "Heart Institute",
    availability: ["Mon 3:00 PM", "Thu 9:00 AM"]
  }
];

export const doctorPatientList: DoctorPatientSummary[] = [
  {
    id: "p001",
    name: "Avery Johnson",
    condition: "Type 2 Diabetes",
    lastVisit: "Mar 02, 2024",
    nextStep: "Quarterly lab panel"
  },
  {
    id: "p002",
    name: "Logan Smith",
    condition: "Hypothyroidism",
    lastVisit: "Feb 18, 2024",
    nextStep: "Adjust levothyroxine"
  },
  {
    id: "p003",
    name: "Mara Lewis",
    condition: "Prediabetes",
    lastVisit: "Jan 30, 2024",
    nextStep: "Nutrition coaching"
  }
];

export const nurseVitals: VitalEntry[] = [
  {
    id: "v01",
    patient: "Avery Johnson",
    department: "Endocrinology",
    heartRate: 72,
    bloodPressure: "118/76",
    temperature: "98.5°F",
    recordedAt: "Today · 08:15"
  },
  {
    id: "v02",
    patient: "Logan Smith",
    department: "Endocrinology",
    heartRate: 64,
    bloodPressure: "121/78",
    temperature: "98.1°F",
    recordedAt: "Today · 08:40"
  }
];

export const labOrdersQueue: LabOrder[] = [
  {
    id: "lo01",
    patient: "Avery Johnson",
    test: "HbA1c",
    status: "in-progress",
    priority: "routine",
    assignedTo: "Tara Snow"
  },
  {
    id: "lo02",
    patient: "Logan Smith",
    test: "Thyroid Panel",
    status: "pending",
    priority: "routine"
  },
  {
    id: "lo03",
    patient: "Mara Lewis",
    test: "Lipid Panel",
    status: "pending",
    priority: "stat"
  }
];

export const waitlist: WaitlistEntry[] = [
  {
    id: "wl01",
    patient: "Avery Johnson",
    doctor: "Dr. Maya Patel",
    preferredDate: "Apr 8 · 11:15 AM",
    status: "waiting"
  },
  {
    id: "wl02",
    patient: "Mara Lewis",
    doctor: "Dr. Simone Alvarez",
    preferredDate: "Apr 12 · 2:30 PM",
    status: "offered"
  }
];

export const adminAnalytics: AdminMetric[] = [
  { label: "Active patients", value: "2,431", trend: "+4.3%" },
  { label: "Appointments this week", value: "386", trend: "+1.1%" },
  { label: "Avg. check-in time", value: "04m 12s", trend: "-0.5%" }
];

export const bulkImportJobs: BulkImportJobSummary[] = [
  {
    id: "bi01",
    fileName: "patients-march.csv",
    status: "processing",
    processed: "40/150 rows",
    errors: "2 rows pending review"
  },
  {
    id: "bi02",
    fileName: "cardio-intake.csv",
    status: "completed",
    processed: "88/88 rows"
  }
];

export const referrals: ReferralSummary[] = [
  {
    id: "ref01",
    patient: "Avery Johnson",
    fromDoctor: "Dr. Maya Patel",
    toDoctor: "Dr. Marcus Lee",
    status: "pending",
    notes: "Neurology consult for migraine plan"
  },
  {
    id: "ref02",
    patient: "Logan Smith",
    fromDoctor: "Dr. Simone Alvarez",
    toDoctor: "Dr. Maya Patel",
    status: "accepted",
    notes: "Shared access granted until Jun 30"
  }
];

export const refillRequests: RefillRequest[] = [
  {
    id: "rr01",
    medication: "Metformin",
    requestedOn: "Mar 11, 2024",
    status: "pending",
    message: "Traveling interstate, need early refill"
  },
  {
    id: "rr02",
    medication: "Sumatriptan",
    requestedOn: "Feb 28, 2024",
    status: "denied",
    denialReason: "Visit required for dosage review"
  }
];

export const shareLinks: ShareLink[] = [
  {
    id: "sl01",
    url: "https://medportal.com/share/abc123",
    expires: "24 hrs",
    status: "active"
  },
  {
    id: "sl02",
    url: "https://medportal.com/share/def456",
    expires: "Expired",
    status: "expired"
  }
];

export const auditTrail: AuditEntry[] = [
  {
    id: "a01",
    actor: "Dr. Maya Patel",
    action: "Viewed record",
    resource: "Neurology consult",
    timestamp: "Today · 09:12"
  },
  {
    id: "a02",
    actor: "Admin Evelyn Wright",
    action: "Generated share link",
    resource: "Medical summary",
    timestamp: "Yesterday · 17:44"
  }
];

export const globalSearchResults: GlobalSearchResult[] = [
  { id: "gs01", label: "Avery Johnson", type: "patient", meta: "Endocrinology · Active referral" },
  { id: "gs02", label: "Dr. Maya Patel", type: "doctor", meta: "Metabolic Health" },
  { id: "gs03", label: "Neurology Consult · 2023", type: "record", meta: "Patient: Avery Johnson" }
];

export const notificationsByRole: Record<UserRole, Notification[]> = {
  PATIENT: [
    {
      id: "n1",
      title: "Appointment reminder",
      description: "Cardiology consult tomorrow at 11:15 AM",
      category: "appointment",
      date: "Today",
      read: false
    },
    {
      id: "n2",
      title: "Lab result ready",
      description: "HbA1c result uploaded by lab team",
      category: "lab",
      date: "2 days ago",
      read: true
    },
    {
      id: "n3",
      title: "Prescription updated",
      description: "Metformin dosage changed",
      category: "prescription",
      date: "5 days ago",
      read: true
    }
  ],
  DOCTOR: [
    {
      id: "n4",
      title: "New patient message",
      description: "Avery Johnson sent a secure message",
      category: "message",
      date: "1h ago",
      read: false
    },
    {
      id: "n5",
      title: "Lab result requires review",
      description: "HbA1c result outside preferred range",
      category: "lab",
      date: "Yesterday",
      read: false
    }
  ],
  NURSE: [
    {
      id: "n6",
      title: "Check-in queue",
      description: "3 patients arrived for Endocrinology",
      category: "appointment",
      date: "Just now",
      read: false
    }
  ],
  LAB_TECH: [
    {
      id: "n7",
      title: "Pending lab order",
      description: "Thyroid Panel awaiting processing",
      category: "lab",
      date: "Today",
      read: false
    }
  ],
  ADMIN: [
    {
      id: "n8",
      title: "Analytics ready",
      description: "Daily utilization report generated",
      category: "system",
      date: "Today",
      read: false
    }
  ]
};

export const messageThreads: MessageThread[] = [
  {
    id: "m1",
    sender: "Dr. Maya Patel",
    subject: "Medication adjustment",
    snippet: "Please increase your morning dose to 750 mg...",
    timestamp: "10:42 AM"
  },
  {
    id: "m2",
    sender: "Nurse Jordan James",
    subject: "Lab preparation",
    snippet: "Remember to fast for 12 hours before your lipid panel.",
    timestamp: "Yesterday"
  }
];
