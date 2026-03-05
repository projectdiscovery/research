import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './db/schema';

const client = createClient({
	url: process.env.DATABASE_URL || 'file:./local.db',
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(client, { schema });

async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password + 'claimflow_salt_v1');
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function seed() {
	console.log('🌱 Seeding database...');

	const passwordHash = await hashPassword('password123');

	const adminId = uuidv4();
	const adjusterId1 = uuidv4();
	const adjusterId2 = uuidv4();
	const agentId1 = uuidv4();
	const agentId2 = uuidv4();
	const underwriterId = uuidv4();
	const customerId1 = uuidv4();
	const customerId2 = uuidv4();
	const customerId3 = uuidv4();

	const users: schema.NewUser[] = [
		{
			id: adminId,
			email: 'admin@claimflow.com',
			passwordHash,
			firstName: 'System',
			lastName: 'Admin',
			phone: '555-000-0001',
			role: 'admin',
			address: '100 Admin Plaza',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94102'
		},
		{
			id: underwriterId,
			email: 'underwriter@claimflow.com',
			passwordHash,
			firstName: 'Patricia',
			lastName: 'Williams',
			phone: '555-000-0006',
			role: 'underwriter',
			address: '600 Risk Ave',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94108'
		},
		{
			id: adjusterId1,
			email: 'adjuster@claimflow.com',
			passwordHash,
			firstName: 'Michael',
			lastName: 'Chen',
			phone: '555-000-0002',
			role: 'adjuster',
			address: '200 Claims Ave',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94103'
		},
		{
			id: adjusterId2,
			email: 'adjuster2@claimflow.com',
			passwordHash,
			firstName: 'Emily',
			lastName: 'Rodriguez',
			phone: '555-000-0005',
			role: 'adjuster',
			address: '250 Claims Ave',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94103'
		},
		{
			id: agentId1,
			email: 'agent@claimflow.com',
			passwordHash,
			firstName: 'Sarah',
			lastName: 'Johnson',
			phone: '555-000-0003',
			role: 'agent',
			address: '300 Insurance Blvd',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94104'
		},
		{
			id: agentId2,
			email: 'agent2@claimflow.com',
			passwordHash,
			firstName: 'David',
			lastName: 'Kim',
			phone: '555-000-0007',
			role: 'agent',
			address: '350 Insurance Blvd',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94104'
		},
		{
			id: customerId1,
			email: 'john.doe@example.com',
			passwordHash,
			firstName: 'John',
			lastName: 'Doe',
			phone: '555-123-4567',
			role: 'policyholder',
			assignedAgentId: agentId1,
			address: '456 Oak Street',
			city: 'Oakland',
			state: 'CA',
			zipCode: '94601',
			dateOfBirth: '1985-06-15'
		},
		{
			id: customerId2,
			email: 'jane.smith@example.com',
			passwordHash,
			firstName: 'Jane',
			lastName: 'Smith',
			phone: '555-987-6543',
			role: 'policyholder',
			assignedAgentId: agentId1,
			address: '789 Pine Avenue',
			city: 'Berkeley',
			state: 'CA',
			zipCode: '94702',
			dateOfBirth: '1990-03-22'
		},
		{
			id: customerId3,
			email: 'robert.wilson@example.com',
			passwordHash,
			firstName: 'Robert',
			lastName: 'Wilson',
			phone: '555-456-7890',
			role: 'policyholder',
			assignedAgentId: agentId2,
			address: '123 Elm Street',
			city: 'San Jose',
			state: 'CA',
			zipCode: '95101',
			dateOfBirth: '1978-11-08'
		}
	];

	console.log('Creating users...');
	for (const user of users) {
		await db.insert(schema.users).values(user).onConflictDoNothing();
	}

	const policyAutoId = uuidv4();
	const policyHomeId = uuidv4();
	const policyHealthId = uuidv4();
	const policyLifeId = uuidv4();
	const policyAuto2Id = uuidv4();
	const policyHighValueId = uuidv4();

	const policies: schema.NewPolicy[] = [
		{
			id: policyAutoId,
			userId: customerId1,
			agentId: agentId1,
			policyNumber: 'POL-AUTO-2024-001',
			type: 'auto',
			status: 'active',
			coverageAmount: 50000,
			deductible: 500,
			premium: 125.00,
			premiumFrequency: 'monthly',
			startDate: '2024-01-01',
			endDate: '2025-01-01',
			description: '2022 Honda Accord - Full Coverage',
			coverageDetails: JSON.stringify({
				liability: { bodily: 100000, property: 50000 },
				collision: 50000,
				comprehensive: 50000,
				medical: 5000,
				uninsured: 100000
			}),
			riskScore: 25
		},
		{
			id: policyHomeId,
			userId: customerId1,
			agentId: agentId1,
			policyNumber: 'POL-HOME-2024-001',
			type: 'home',
			status: 'active',
			coverageAmount: 350000,
			deductible: 1000,
			premium: 185.00,
			premiumFrequency: 'monthly',
			startDate: '2024-02-15',
			endDate: '2025-02-15',
			description: '456 Oak Street - Homeowners Policy',
			coverageDetails: JSON.stringify({
				dwelling: 350000,
				personalProperty: 175000,
				liability: 300000,
				medicalPayments: 5000,
				additionalLiving: 70000
			}),
			riskScore: 30
		},
		{
			id: policyHealthId,
			userId: customerId1,
			agentId: agentId1,
			policyNumber: 'POL-HLTH-2024-001',
			type: 'health',
			status: 'active',
			coverageAmount: 1000000,
			deductible: 2500,
			premium: 450.00,
			premiumFrequency: 'monthly',
			startDate: '2024-01-01',
			endDate: '2024-12-31',
			description: 'Family Health Plan - PPO',
			coverageDetails: JSON.stringify({
				type: 'PPO',
				inNetworkDeductible: 2500,
				outOfNetworkDeductible: 5000,
				maxOutOfPocket: 8000,
				preventiveCare: 'Covered 100%',
				emergencyRoom: '20% after deductible',
				prescriptions: { generic: 10, brandPreferred: 30, brandNonPreferred: 50 }
			}),
			riskScore: 20
		},
		{
			id: policyLifeId,
			userId: customerId2,
			agentId: agentId1,
			policyNumber: 'POL-LIFE-2024-001',
			type: 'life',
			status: 'active',
			coverageAmount: 500000,
			deductible: 0,
			premium: 75.00,
			premiumFrequency: 'monthly',
			startDate: '2024-03-01',
			endDate: '2044-03-01',
			description: '20-Year Term Life Insurance',
			coverageDetails: JSON.stringify({
				type: 'Term',
				termLength: 20,
				beneficiary: 'Estate',
				riders: ['Accidental Death', 'Waiver of Premium']
			}),
			riskScore: 15
		},
		{
			id: policyAuto2Id,
			userId: customerId2,
			agentId: agentId1,
			policyNumber: 'POL-AUTO-2024-002',
			type: 'auto',
			status: 'active',
			coverageAmount: 75000,
			deductible: 250,
			premium: 145.00,
			premiumFrequency: 'monthly',
			startDate: '2024-01-15',
			endDate: '2025-01-15',
			description: '2023 Tesla Model 3 - Premium Coverage',
			coverageDetails: JSON.stringify({
				liability: { bodily: 250000, property: 100000 },
				collision: 75000,
				comprehensive: 75000,
				medical: 10000,
				uninsured: 250000,
				roadside: true,
				rental: 50
			}),
			riskScore: 35
		},
		{
			id: policyHighValueId,
			userId: customerId3,
			agentId: agentId2,
			policyNumber: 'POL-HOME-2024-002',
			type: 'home',
			status: 'active',
			coverageAmount: 1500000,
			deductible: 5000,
			premium: 850.00,
			premiumFrequency: 'monthly',
			startDate: '2024-01-01',
			endDate: '2025-01-01',
			description: '123 Elm Street - Luxury Home Coverage',
			coverageDetails: JSON.stringify({
				dwelling: 1500000,
				personalProperty: 750000,
				liability: 1000000,
				medicalPayments: 10000,
				additionalLiving: 300000,
				valuables: { jewelry: 100000, art: 200000, wine: 50000 }
			}),
			riskScore: 45
		}
	];

	console.log('Creating policies...');
	for (const policy of policies) {
		await db.insert(schema.policies).values(policy).onConflictDoNothing();
	}

	const claimId1 = uuidv4();
	const claimId2 = uuidv4();
	const claimId3 = uuidv4();
	const claimId4 = uuidv4();
	const claimId5 = uuidv4();
	const claimId6 = uuidv4();

	const claims: schema.NewClaim[] = [
		{
			id: claimId1,
			policyId: policyAutoId,
			userId: customerId1,
			assignedAdjusterId: adjusterId1,
			claimNumber: 'CLM-2024-00001',
			type: 'accident',
			status: 'under_review',
			priority: 'medium',
			description: 'Rear-ended at traffic light on Market Street. Minor damage to rear bumper and tail lights. Other driver was cited.',
			incidentDate: '2024-11-15',
			incidentLocation: 'Market Street & 5th Ave, San Francisco, CA',
			amountClaimed: 3500,
			requiresUnderwriterReview: false,
			submittedAt: '2024-11-16T10:30:00Z'
		},
		{
			id: claimId2,
			policyId: policyHomeId,
			userId: customerId1,
			assignedAdjusterId: adjusterId1,
			claimNumber: 'CLM-2024-00002',
			type: 'damage',
			status: 'approved',
			priority: 'high',
			description: 'Water damage from burst pipe in upstairs bathroom. Affected bathroom floor, ceiling below, and some personal property.',
			incidentDate: '2024-10-20',
			incidentLocation: '456 Oak Street, Oakland, CA',
			amountClaimed: 12500,
			amountApproved: 11200,
			amountRecommended: 11200,
			requiresUnderwriterReview: false,
			submittedAt: '2024-10-21T14:00:00Z',
			reviewedAt: '2024-10-28T09:15:00Z'
		},
		{
			id: claimId3,
			policyId: policyHealthId,
			userId: customerId1,
			claimNumber: 'CLM-2024-00003',
			type: 'medical',
			status: 'paid',
			priority: 'medium',
			description: 'Emergency room visit for broken arm. X-rays, cast, and follow-up appointment.',
			incidentDate: '2024-09-10',
			incidentLocation: 'UCSF Medical Center',
			amountClaimed: 4200,
			amountApproved: 4200,
			requiresUnderwriterReview: false,
			submittedAt: '2024-09-11T08:00:00Z',
			reviewedAt: '2024-09-15T11:30:00Z',
			resolvedAt: '2024-09-20T16:00:00Z'
		},
		{
			id: claimId4,
			policyId: policyAuto2Id,
			userId: customerId2,
			assignedAdjusterId: adjusterId2,
			claimNumber: 'CLM-2024-00004',
			type: 'theft',
			status: 'investigation',
			priority: 'medium',
			description: 'Vehicle broken into in parking garage. Laptop, sunglasses, and charging cables stolen from interior.',
			incidentDate: '2024-12-01',
			incidentLocation: 'Downtown Berkeley Parking Garage',
			amountClaimed: 2800,
			requiresUnderwriterReview: false,
			submittedAt: '2024-12-02T09:00:00Z'
		},
		{
			id: claimId5,
			policyId: policyAutoId,
			userId: customerId1,
			assignedAdjusterId: adjusterId1,
			claimNumber: 'CLM-2024-00005',
			type: 'accident',
			status: 'denied',
			priority: 'low',
			description: 'Fender bender in parking lot. Scratch on driver side door.',
			incidentDate: '2024-08-05',
			incidentLocation: 'Whole Foods parking lot, Oakland, CA',
			amountClaimed: 800,
			amountApproved: 0,
			requiresUnderwriterReview: false,
			submittedAt: '2024-08-06T15:30:00Z',
			reviewedAt: '2024-08-10T10:00:00Z',
			resolvedAt: '2024-08-10T10:00:00Z',
			denialReason: 'Damage below deductible amount. Claimed amount ($800) is less than policy deductible ($500) plus applicable fees.'
		},
		{
			id: claimId6,
			policyId: policyHighValueId,
			userId: customerId3,
			assignedAdjusterId: adjusterId1,
			underwriterId: underwriterId,
			claimNumber: 'CLM-2024-00006',
			type: 'damage',
			status: 'pending_approval',
			priority: 'urgent',
			description: 'Fire damage to kitchen and adjacent dining room. Caused by electrical fault in built-in appliances. Significant smoke damage throughout first floor.',
			incidentDate: '2024-12-10',
			incidentLocation: '123 Elm Street, San Jose, CA',
			amountClaimed: 175000,
			amountRecommended: 165000,
			requiresUnderwriterReview: true,
			submittedAt: '2024-12-11T08:00:00Z',
			reviewedAt: '2024-12-15T14:00:00Z'
		}
	];

	console.log('Creating claims...');
	for (const claim of claims) {
		await db.insert(schema.claims).values(claim).onConflictDoNothing();
	}

	const claimNotes: schema.NewClaimNote[] = [
		{
			id: uuidv4(),
			claimId: claimId1,
			userId: adjusterId1,
			noteType: 'investigation',
			content: 'Reviewed police report. Other driver cited for following too closely. Damage photos consistent with rear-end collision.',
			isInternal: true
		},
		{
			id: uuidv4(),
			claimId: claimId1,
			userId: adjusterId1,
			noteType: 'document_request',
			content: 'Requested repair estimate from certified body shop. Customer notified via email.',
			isInternal: false
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			userId: adjusterId1,
			noteType: 'investigation',
			content: 'On-site inspection completed. Damage verified. Plumber report confirms pipe failure due to age, not negligence.',
			isInternal: true
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			userId: adjusterId1,
			noteType: 'payout',
			content: 'Recommended payout: $11,200. Deduction: $1,000 deductible + $300 depreciation on damaged items.',
			isInternal: true
		},
		{
			id: uuidv4(),
			claimId: claimId4,
			userId: adjusterId2,
			noteType: 'document_request',
			content: 'Need police report number and receipts for stolen items. Contacted customer for additional documentation.',
			isInternal: false
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			userId: adjusterId1,
			noteType: 'investigation',
			content: 'Fire marshal report received. Cause determined to be electrical fault in range hood. No indication of negligence.',
			isInternal: true
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			userId: adjusterId1,
			noteType: 'payout',
			content: 'Recommended payout: $165,000. Breakdown: Kitchen rebuild $95,000, Dining room $35,000, Contents $25,000, Smoke remediation $10,000. Deductible: $5,000.',
			isInternal: true
		}
	];

	console.log('Creating claim notes...');
	for (const note of claimNotes) {
		await db.insert(schema.claimNotes).values(note).onConflictDoNothing();
	}

	const communications: schema.NewCommunication[] = [
		{
			id: uuidv4(),
			claimId: claimId1,
			senderId: adjusterId1,
			recipientId: customerId1,
			subject: 'Claim CLM-2024-00001 - Additional Information Needed',
			message: 'Hello John,\n\nThank you for submitting your claim. To proceed with the review, we need the following:\n\n1. Police report number\n2. Photos of the damage\n3. Contact information for the other driver\n\nPlease upload these documents to your claim portal.\n\nBest regards,\nMichael Chen\nClaims Adjuster',
			isRead: true,
			readAt: '2024-11-17T08:00:00Z',
			createdAt: '2024-11-16T14:30:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId1,
			senderId: customerId1,
			recipientId: adjusterId1,
			subject: 'Re: Claim CLM-2024-00001 - Additional Information Needed',
			message: 'Hi Michael,\n\nI\'ve uploaded the photos and police report (Report #SF-2024-112234). The other driver\'s insurance info is:\n\nDriver: Robert Martinez\nInsurance: StateFarm Policy #: 123-456-789\nPhone: 555-234-5678\n\nPlease let me know if you need anything else.\n\nThanks,\nJohn',
			isRead: true,
			readAt: '2024-11-18T09:15:00Z',
			createdAt: '2024-11-17T16:45:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			senderId: adjusterId1,
			recipientId: customerId1,
			subject: 'Claim CLM-2024-00002 - Approved',
			message: 'Dear John,\n\nGreat news! Your claim for water damage has been approved.\n\nClaimed Amount: $12,500\nApproved Amount: $11,200\n\nThe difference of $1,300 was deducted based on:\n- Policy deductible: $1,000\n- Depreciation on affected items: $300\n\nPayment will be processed within 5-7 business days.\n\nThank you for your patience.\n\nBest regards,\nMichael Chen',
			isRead: true,
			readAt: '2024-10-29T10:00:00Z',
			createdAt: '2024-10-28T09:20:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId4,
			senderId: adjusterId2,
			recipientId: customerId2,
			subject: 'Claim CLM-2024-00004 - Documents Required',
			message: 'Hello Jane,\n\nThank you for filing your claim regarding the vehicle break-in. To proceed with your claim, we need:\n\n1. Police report for the incident\n2. Original receipts or proof of purchase for stolen items\n3. Photos of the damage to your vehicle\n\nPlease upload these at your earliest convenience.\n\nBest regards,\nEmily Rodriguez\nClaims Adjuster',
			isRead: false,
			createdAt: '2024-12-03T11:00:00Z'
		}
	];

	console.log('Creating communications...');
	for (const comm of communications) {
		await db.insert(schema.communications).values(comm).onConflictDoNothing();
	}

	const notifications: schema.NewNotification[] = [
		{
			id: uuidv4(),
			userId: customerId1,
			type: 'claim_status',
			title: 'Claim Approved - CLM-2024-00002',
			message: 'Your water damage claim has been approved for $11,200. Payment will be processed within 5-7 business days.',
			relatedClaimId: claimId2,
			isRead: true,
			readAt: '2024-10-29T10:05:00Z',
			actionUrl: '/claims/' + claimId2
		},
		{
			id: uuidv4(),
			userId: customerId2,
			type: 'document_request',
			title: 'Documents Needed - CLM-2024-00004',
			message: 'Your claims adjuster has requested additional documents for your theft claim.',
			relatedClaimId: claimId4,
			isRead: false,
			actionUrl: '/claims/' + claimId4
		},
		{
			id: uuidv4(),
			userId: underwriterId,
			type: 'approval_needed',
			title: 'High-Value Claim Requires Review',
			message: 'Claim CLM-2024-00006 ($175,000) requires underwriter approval before proceeding.',
			relatedClaimId: claimId6,
			isRead: false,
			actionUrl: '/underwriter/claims/' + claimId6
		},
		{
			id: uuidv4(),
			userId: adjusterId1,
			type: 'assignment',
			title: 'New Claim Assigned',
			message: 'A new high-priority claim (CLM-2024-00006) has been assigned to you.',
			relatedClaimId: claimId6,
			isRead: true,
			readAt: '2024-12-11T09:00:00Z',
			actionUrl: '/adjuster/claims/' + claimId6
		}
	];

	console.log('Creating notifications...');
	for (const notif of notifications) {
		await db.insert(schema.notifications).values(notif).onConflictDoNothing();
	}

	const documents: schema.NewDocument[] = [
		{
			id: uuidv4(),
			claimId: claimId1,
			userId: customerId1,
			fileName: 'rear_bumper_damage.jpg',
			originalName: 'rear_bumper_damage.jpg',
			fileType: 'image/jpeg',
			fileSize: 2456000,
			filePath: '/uploads/claims/clm-2024-00001/rear_bumper_damage.jpg',
			documentType: 'photo',
			description: 'Photo of rear bumper damage',
			isVerified: true,
			verifiedBy: adjusterId1,
			verifiedAt: '2024-11-18T10:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId1,
			userId: customerId1,
			fileName: 'police_report_SF-2024-112234.pdf',
			originalName: 'police_report_SF-2024-112234.pdf',
			fileType: 'application/pdf',
			fileSize: 156000,
			filePath: '/uploads/claims/clm-2024-00001/police_report_SF-2024-112234.pdf',
			documentType: 'police_report',
			description: 'San Francisco PD accident report',
			isVerified: true,
			verifiedBy: adjusterId1,
			verifiedAt: '2024-11-18T10:05:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			userId: customerId1,
			fileName: 'water_damage_bathroom.jpg',
			originalName: 'water_damage_bathroom.jpg',
			fileType: 'image/jpeg',
			fileSize: 3200000,
			filePath: '/uploads/claims/clm-2024-00002/water_damage_bathroom.jpg',
			documentType: 'photo',
			description: 'Water damage in upstairs bathroom',
			isVerified: true,
			verifiedBy: adjusterId1,
			verifiedAt: '2024-10-25T14:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			userId: customerId1,
			fileName: 'plumber_repair_estimate.pdf',
			originalName: 'plumber_repair_estimate.pdf',
			fileType: 'application/pdf',
			fileSize: 89000,
			filePath: '/uploads/claims/clm-2024-00002/plumber_repair_estimate.pdf',
			documentType: 'estimate',
			description: 'Repair estimate from ABC Plumbing',
			isVerified: true,
			verifiedBy: adjusterId1,
			verifiedAt: '2024-10-25T14:05:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			userId: customerId3,
			fileName: 'fire_damage_kitchen.jpg',
			originalName: 'fire_damage_kitchen.jpg',
			fileType: 'image/jpeg',
			fileSize: 4500000,
			filePath: '/uploads/claims/clm-2024-00006/fire_damage_kitchen.jpg',
			documentType: 'photo',
			description: 'Fire damage to kitchen area',
			isVerified: true,
			verifiedBy: adjusterId1,
			verifiedAt: '2024-12-12T11:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			userId: customerId3,
			fileName: 'fire_marshal_report.pdf',
			originalName: 'fire_marshal_report.pdf',
			fileType: 'application/pdf',
			fileSize: 234000,
			filePath: '/uploads/claims/clm-2024-00006/fire_marshal_report.pdf',
			documentType: 'other',
			description: 'Official fire marshal investigation report',
			isVerified: true,
			verifiedBy: adjusterId1,
			verifiedAt: '2024-12-14T09:00:00Z'
		}
	];

	console.log('Creating documents...');
	for (const doc of documents) {
		await db.insert(schema.documents).values(doc).onConflictDoNothing();
	}

	// Workflow History
	const workflowHistory: schema.NewClaimWorkflowHistory[] = [
		{
			id: uuidv4(),
			claimId: claimId1,
			fromStatus: 'draft',
			toStatus: 'filed',
			userId: customerId1,
			notes: 'Claim filed by policyholder',
			createdAt: '2024-11-16T10:30:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId1,
			fromStatus: 'filed',
			toStatus: 'under_review',
			userId: adjusterId1,
			notes: 'Assigned for review',
			createdAt: '2024-11-16T11:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			fromStatus: 'draft',
			toStatus: 'filed',
			userId: customerId1,
			notes: 'Claim filed by policyholder',
			createdAt: '2024-10-21T14:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			fromStatus: 'filed',
			toStatus: 'under_review',
			userId: adjusterId1,
			notes: 'Assigned for review',
			createdAt: '2024-10-22T09:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			fromStatus: 'under_review',
			toStatus: 'estimation',
			userId: adjusterId1,
			notes: 'Investigation complete, proceeding to estimation',
			createdAt: '2024-10-25T15:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId2,
			fromStatus: 'estimation',
			toStatus: 'approved',
			userId: adjusterId1,
			notes: 'Claim approved for $11,200',
			createdAt: '2024-10-28T09:15:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			fromStatus: 'draft',
			toStatus: 'filed',
			userId: customerId3,
			notes: 'High-value fire damage claim filed',
			createdAt: '2024-12-11T08:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			fromStatus: 'filed',
			toStatus: 'under_review',
			userId: adjusterId1,
			notes: 'Urgent: assigned for immediate review',
			createdAt: '2024-12-11T08:30:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			fromStatus: 'under_review',
			toStatus: 'investigation',
			userId: adjusterId1,
			notes: 'Fire marshal report requested',
			createdAt: '2024-12-12T10:00:00Z'
		}
	];

	console.log('Creating workflow history...');
	for (const history of workflowHistory) {
		await db.insert(schema.claimWorkflowHistory).values(history).onConflictDoNothing();
	}

	// Fraud Alerts
	const fraudAlerts: schema.NewFraudAlert[] = [
		{
			id: uuidv4(),
			claimId: claimId6,
			alertType: 'high_amount',
			severity: 'medium',
			description: 'High-value claim: $175,000',
			metadata: JSON.stringify({ amountClaimed: 175000 }),
			isResolved: false
		}
	];

	console.log('Creating fraud alerts...');
	for (const alert of fraudAlerts) {
		await db.insert(schema.fraudAlerts).values(alert).onConflictDoNothing();
	}

	// Policy Renewals (for policies expiring soon)
	const policyRenewals: schema.NewPolicyRenewal[] = [
		{
			id: uuidv4(),
			policyId: policyAutoId,
			status: 'sent',
			newPremium: 131.25,
			newCoverageAmount: 50000,
			renewalDate: '2025-01-01',
			expiryDate: '2025-01-01',
			noticesSentAt: '2024-12-01T10:00:00Z',
			reviewNotes: null,
			customerResponse: null,
			respondedAt: null
		},
		{
			id: uuidv4(),
			policyId: policyHighValueId,
			status: 'pending',
			newPremium: 1020.00,
			newCoverageAmount: 1500000,
			renewalDate: '2025-01-01',
			expiryDate: '2025-01-01',
			noticesSentAt: null,
			reviewNotes: 'Pending underwriter review due to recent high-value claim',
			customerResponse: null,
			respondedAt: null
		}
	];

	console.log('Creating policy renewals...');
	for (const renewal of policyRenewals) {
		await db.insert(schema.policyRenewals).values(renewal).onConflictDoNothing();
	}

	// Settlement Calculations
	const settlements: schema.NewSettlementCalculation[] = [
		{
			id: uuidv4(),
			claimId: claimId2,
			calculatedBy: adjusterId1,
			damageDetails: JSON.stringify([
				{ category: 'property', description: 'Bathroom floor replacement', estimatedCost: 4500, ageYears: 5, condition: 'good' },
				{ category: 'property', description: 'Ceiling repair', estimatedCost: 3200, ageYears: 5, condition: 'good' },
				{ category: 'property', description: 'Personal items damaged', estimatedCost: 2800, ageYears: 3, condition: 'fair' },
				{ category: 'labor', description: 'Plumbing repair', estimatedCost: 2000, ageYears: 0, condition: 'excellent' }
			]),
			totalDamage: 12500,
			deductible: 1000,
			depreciation: 300,
			coverageLimit: 350000,
			calculatedPayout: 11200,
			finalPayout: 11200,
			overrideReason: null,
			isOverridden: false,
			createdAt: '2024-10-27T14:00:00Z'
		},
		{
			id: uuidv4(),
			claimId: claimId6,
			calculatedBy: adjusterId1,
			damageDetails: JSON.stringify([
				{ category: 'property', description: 'Kitchen rebuild', estimatedCost: 95000, ageYears: 8, condition: 'good' },
				{ category: 'property', description: 'Dining room restoration', estimatedCost: 35000, ageYears: 8, condition: 'good' },
				{ category: 'personal_items', description: 'Kitchen contents', estimatedCost: 25000, ageYears: 5, condition: 'good' },
				{ category: 'other', description: 'Smoke remediation', estimatedCost: 15000, ageYears: 0, condition: 'excellent' }
			]),
			totalDamage: 170000,
			deductible: 5000,
			depreciation: 0,
			coverageLimit: 1500000,
			calculatedPayout: 165000,
			finalPayout: null,
			overrideReason: null,
			isOverridden: false,
			createdAt: '2024-12-15T10:00:00Z'
		}
	];

	console.log('Creating settlement calculations...');
	for (const settlement of settlements) {
		await db.insert(schema.settlementCalculations).values(settlement).onConflictDoNothing();
	}

	console.log('✅ Database seeded successfully!');
	console.log('\n📋 Test accounts (password for all: "password123"):');
	console.log('  👤 Policyholder:  john.doe@example.com, jane.smith@example.com, robert.wilson@example.com');
	console.log('  🔍 Adjuster:      adjuster@claimflow.com, adjuster2@claimflow.com');
	console.log('  🤝 Agent:         agent@claimflow.com, agent2@claimflow.com');
	console.log('  📊 Underwriter:   underwriter@claimflow.com');
	console.log('  ⚙️  Admin:         admin@claimflow.com');
}

seed().catch(console.error);
