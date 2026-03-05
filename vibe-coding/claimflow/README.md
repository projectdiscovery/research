# ClaimFlow - Insurance Claims Management System

A full-featured insurance claims management platform built with SvelteKit, featuring role-based access control, automated claim processing, fraud detection, and comprehensive reporting.

## Overview

ClaimFlow is a modern web application designed for insurance companies to manage the complete lifecycle of insurance claims. It supports multiple user roles with tailored dashboards and workflows for each.

## Features

### Authentication & Authorization
- Custom session-based authentication with HTTP-only cookies
- Role-based access control (RBAC) with 5 distinct roles
- Secure password hashing with session management

### User Roles

| Role | Capabilities |
|------|-------------|
| **Policyholder** | View policies, file claims, upload documents, track status, communicate with adjusters |
| **Claims Adjuster** | Review assigned claims, update status, add notes, calculate settlements, verify documents |
| **Agent/Broker** | Manage customer policies, assist with claims, view commissions, add new policyholders |
| **Underwriter** | Review high-value claims ($50K+), assess risk, approve/deny policy renewals |
| **Admin** | Manage users, batch operations, system analytics, configure workflows |

### Claim Workflow Engine
- Configurable state machine with 12 statuses:
  ```
  Draft → Filed → Under Review → Investigation → Estimation → 
  Pending Approval → Approved/Denied → Payment Pending → Paid → Closed
  ```
- Role-based transition permissions
- Required field validation per transition
- Automatic underwriter flagging for high-value claims

### Automated Claim Triage
- Auto-assignment based on adjuster workload and specialization
- Fraud detection with configurable rules:
  - Multiple claims in 30-day period
  - Claim amount near coverage limit (90%+)
  - Recently opened policy (within 30 days)
  - Delayed filing (30+ days after incident)
  - Potential duplicate detection

### Settlement Calculator
- Damage item entry with categories
- Automatic depreciation calculation by policy type
- Deductible application and coverage limit enforcement
- Manual override capability with justification tracking

### Document Management
- Support for images, PDFs, and videos up to 50MB
- Document verification workflow
- Timeline view with upload history
- Version tracking

### Policy Renewal Workflow
- Automatic renewal notices 30 days before expiry
- Premium adjustment based on claim history
- Underwriter review for high-risk policies
- Customer accept/reject tracking

### Communication System
- Threaded messaging per claim
- File attachments in messages
- Read/unread status tracking
- Real-time notifications

### Batch Operations
- Bulk status updates
- Mass claim assignment
- CSV export with filters

### Analytics Dashboard
- Claims by status, type, and priority
- Approval/denial rates
- Processing time metrics
- Adjuster performance reports
- Fraud statistics

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | SvelteKit 2.x with Svelte 5 |
| Language | TypeScript |
| Database | SQLite with Drizzle ORM |
| Styling | Tailwind CSS 4.x |
| Icons | Lucide Svelte |
| Date Handling | date-fns |

## Project Structure

```
claimflow/
├── src/
│   ├── app.css                 # Global styles and Tailwind config
│   ├── app.html                # HTML template
│   ├── hooks.server.ts         # Auth middleware
│   │
│   ├── lib/
│   │   ├── components/         # Reusable Svelte components
│   │   │   ├── AppShell.svelte
│   │   │   ├── DocumentTimeline.svelte
│   │   │   └── WorkflowTimeline.svelte
│   │   │
│   │   └── server/             # Server-side modules
│   │       ├── db/
│   │       │   ├── index.ts    # Database connection
│   │       │   └── schema.ts   # Drizzle ORM schema
│   │       ├── auth.ts         # Authentication logic
│   │       ├── batch.ts        # Batch operations
│   │       ├── notifications.ts
│   │       ├── rbac.ts         # Role-based access control
│   │       ├── renewals.ts     # Policy renewal workflow
│   │       ├── reports.ts      # Analytics/reporting
│   │       ├── seed.ts         # Database seeding
│   │       ├── settlement.ts   # Settlement calculator
│   │       ├── triage.ts       # Auto-assignment & fraud detection
│   │       ├── uploads.ts      # Document uploads
│   │       └── workflow.ts     # Claim state machine
│   │
│   └── routes/                 # SvelteKit routes
│       ├── auth/               # Login, register, logout
│       ├── dashboard/          # Policyholder dashboard
│       ├── policies/           # Policy management
│       ├── claims/             # Claims management
│       ├── messages/           # Messaging
│       ├── settings/           # User settings
│       ├── adjuster/           # Adjuster dashboard
│       ├── agent/              # Agent dashboard
│       ├── underwriter/        # Underwriter dashboard
│       ├── admin/              # Admin dashboard
│       └── api/                # API endpoints
│
├── drizzle.config.ts           # Database configuration
├── svelte.config.js            # SvelteKit configuration
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite configuration
└── package.json
```

## Database Schema

### Core Tables
- `users` - User accounts with role assignments
- `policies` - Insurance policies
- `claims` - Insurance claims
- `documents` - Uploaded files
- `communications` - Messages between users

### Supporting Tables
- `sessions` - User sessions
- `notifications` - In-app notifications
- `claimNotes` - Investigation and status notes
- `claimWorkflowHistory` - Status transition audit trail
- `settlementCalculations` - Payout calculations
- `policyRenewals` - Renewal tracking
- `fraudAlerts` - Fraud detection flags
- `messageAttachments` - Message file attachments
- `auditLogs` - System audit trail

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claims/workflow` | GET/POST | Workflow transitions and history |
| `/api/claims/triage` | POST | Auto-assignment and fraud check |
| `/api/claims/settlement` | GET/POST | Settlement calculations |
| `/api/claims/export` | GET | CSV export |
| `/api/documents` | POST | File uploads |
| `/api/notifications` | GET/POST | Notification management |
| `/api/renewals` | GET/POST | Renewal management |

## Demo Accounts

All accounts use password: `password123`

| Role | Email |
|------|-------|
| Admin | admin@claimflow.com |
| Underwriter | underwriter@claimflow.com |
| Adjuster | adjuster@claimflow.com |
| Adjuster | adjuster2@claimflow.com |
| Agent | agent@claimflow.com |
| Agent | agent2@claimflow.com |
| Policyholder | john.doe@example.com |
| Policyholder | jane.smith@example.com |
| Policyholder | robert.wilson@example.com |

## License

MIT License

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.
