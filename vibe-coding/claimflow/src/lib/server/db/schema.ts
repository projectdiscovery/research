import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	phone: text('phone'),
	address: text('address'),
	city: text('city'),
	state: text('state'),
	zipCode: text('zip_code'),
	dateOfBirth: text('date_of_birth'),
	role: text('role', { enum: ['policyholder', 'adjuster', 'agent', 'underwriter', 'admin'] }).notNull().default('policyholder'),
	assignedAgentId: text('assigned_agent_id'),
	avatarUrl: text('avatar_url'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	lastLoginAt: text('last_login_at'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const policies = sqliteTable('policies', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id),
	agentId: text('agent_id').references(() => users.id),
	policyNumber: text('policy_number').notNull().unique(),
	type: text('type', { enum: ['auto', 'home', 'health', 'life'] }).notNull(),
	status: text('status', { enum: ['active', 'pending', 'expired', 'cancelled', 'pending_renewal'] }).notNull().default('active'),
	coverageAmount: real('coverage_amount').notNull(),
	deductible: real('deductible').notNull(),
	premium: real('premium').notNull(),
	premiumFrequency: text('premium_frequency', { enum: ['monthly', 'quarterly', 'annually'] }).notNull().default('monthly'),
	startDate: text('start_date').notNull(),
	endDate: text('end_date').notNull(),
	description: text('description'),
	coverageDetails: text('coverage_details'),
	riskScore: integer('risk_score'),
	underwriterId: text('underwriter_id').references(() => users.id),
	underwriterNotes: text('underwriter_notes'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const claims = sqliteTable('claims', {
	id: text('id').primaryKey(),
	policyId: text('policy_id').notNull().references(() => policies.id),
	userId: text('user_id').notNull().references(() => users.id),
	assignedAdjusterId: text('assigned_adjuster_id').references(() => users.id),
	claimNumber: text('claim_number').notNull().unique(),
	type: text('type', { enum: ['accident', 'theft', 'damage', 'medical', 'liability', 'other'] }).notNull(),
	status: text('status', { enum: ['draft', 'filed', 'under_review', 'investigation', 'estimation', 'pending_approval', 'approved', 'denied', 'payment_pending', 'paid', 'closed', 'reopened'] }).notNull().default('draft'),
	priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
	description: text('description').notNull(),
	incidentDate: text('incident_date').notNull(),
	incidentLocation: text('incident_location'),
	amountClaimed: real('amount_claimed').notNull(),
	amountApproved: real('amount_approved'),
	amountRecommended: real('amount_recommended'),
	requiresUnderwriterReview: integer('requires_underwriter_review', { mode: 'boolean' }).notNull().default(false),
	underwriterId: text('underwriter_id').references(() => users.id),
	underwriterDecision: text('underwriter_decision', { enum: ['pending', 'approved', 'denied', 'modified'] }),
	underwriterNotes: text('underwriter_notes'),
	fraudScore: integer('fraud_score'),
	fraudFlags: text('fraud_flags'),
	reopenReason: text('reopen_reason'),
	submittedAt: text('submitted_at'),
	reviewedAt: text('reviewed_at'),
	resolvedAt: text('resolved_at'),
	denialReason: text('denial_reason'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const claimNotes = sqliteTable('claim_notes', {
	id: text('id').primaryKey(),
	claimId: text('claim_id').notNull().references(() => claims.id),
	userId: text('user_id').notNull().references(() => users.id),
	noteType: text('note_type', { enum: ['investigation', 'internal', 'customer_contact', 'document_request', 'status_change', 'payout'] }).notNull(),
	content: text('content').notNull(),
	isInternal: integer('is_internal', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const documents = sqliteTable('documents', {
	id: text('id').primaryKey(),
	claimId: text('claim_id').references(() => claims.id),
	policyId: text('policy_id').references(() => policies.id),
	userId: text('user_id').notNull().references(() => users.id),
	fileName: text('file_name').notNull(),
	originalName: text('original_name').notNull(),
	fileType: text('file_type').notNull(),
	fileSize: integer('file_size').notNull(),
	filePath: text('file_path').notNull(),
	documentType: text('document_type', { 
		enum: ['photo', 'receipt', 'police_report', 'medical_record', 'estimate', 'identification', 'policy_document', 'proof_of_loss', 'other'] 
	}).notNull(),
	description: text('description'),
	isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
	verifiedBy: text('verified_by').references(() => users.id),
	verifiedAt: text('verified_at'),
	uploadedAt: text('uploaded_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const communications = sqliteTable('communications', {
	id: text('id').primaryKey(),
	claimId: text('claim_id').notNull().references(() => claims.id),
	senderId: text('sender_id').notNull().references(() => users.id),
	recipientId: text('recipient_id').references(() => users.id),
	subject: text('subject'),
	message: text('message').notNull(),
	isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
	readAt: text('read_at'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const notifications = sqliteTable('notifications', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id),
	type: text('type', { enum: ['claim_status', 'document_request', 'message', 'assignment', 'approval_needed', 'system'] }).notNull(),
	title: text('title').notNull(),
	message: text('message').notNull(),
	relatedClaimId: text('related_claim_id').references(() => claims.id),
	relatedPolicyId: text('related_policy_id').references(() => policies.id),
	isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
	readAt: text('read_at'),
	actionUrl: text('action_url'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id),
	expiresAt: text('expires_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const auditLogs = sqliteTable('audit_logs', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id),
	action: text('action').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	oldValues: text('old_values'),
	newValues: text('new_values'),
	ipAddress: text('ip_address'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const claimWorkflowHistory = sqliteTable('claim_workflow_history', {
	id: text('id').primaryKey(),
	claimId: text('claim_id').notNull().references(() => claims.id),
	fromStatus: text('from_status').notNull(),
	toStatus: text('to_status').notNull(),
	userId: text('user_id').notNull().references(() => users.id),
	notes: text('notes'),
	metadata: text('metadata'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const documentVersions = sqliteTable('document_versions', {
	id: text('id').primaryKey(),
	documentId: text('document_id').notNull().references(() => documents.id),
	version: integer('version').notNull(),
	fileName: text('file_name').notNull(),
	filePath: text('file_path').notNull(),
	fileSize: integer('file_size').notNull(),
	uploadedBy: text('uploaded_by').notNull().references(() => users.id),
	changeNotes: text('change_notes'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const settlementCalculations = sqliteTable('settlement_calculations', {
	id: text('id').primaryKey(),
	claimId: text('claim_id').notNull().references(() => claims.id),
	calculatedBy: text('calculated_by').notNull().references(() => users.id),
	damageDetails: text('damage_details').notNull(),
	totalDamage: real('total_damage').notNull(),
	deductible: real('deductible').notNull(),
	depreciation: real('depreciation').notNull(),
	coverageLimit: real('coverage_limit').notNull(),
	calculatedPayout: real('calculated_payout').notNull(),
	finalPayout: real('final_payout'),
	overrideReason: text('override_reason'),
	isOverridden: integer('is_overridden', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const policyRenewals = sqliteTable('policy_renewals', {
	id: text('id').primaryKey(),
	policyId: text('policy_id').notNull().references(() => policies.id),
	status: text('status', { enum: ['pending', 'sent', 'accepted', 'rejected', 'expired'] }).notNull().default('pending'),
	newPremium: real('new_premium'),
	newCoverageAmount: real('new_coverage_amount'),
	renewalDate: text('renewal_date').notNull(),
	expiryDate: text('expiry_date').notNull(),
	noticesSentAt: text('notices_sent_at'),
	reviewedBy: text('reviewed_by').references(() => users.id),
	reviewNotes: text('review_notes'),
	customerResponse: text('customer_response'),
	respondedAt: text('responded_at'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const messageAttachments = sqliteTable('message_attachments', {
	id: text('id').primaryKey(),
	communicationId: text('communication_id').notNull().references(() => communications.id),
	fileName: text('file_name').notNull(),
	originalName: text('original_name').notNull(),
	fileType: text('file_type').notNull(),
	fileSize: integer('file_size').notNull(),
	filePath: text('file_path').notNull(),
	uploadedAt: text('uploaded_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const fraudAlerts = sqliteTable('fraud_alerts', {
	id: text('id').primaryKey(),
	claimId: text('claim_id').notNull().references(() => claims.id),
	alertType: text('alert_type', { enum: ['multiple_claims', 'high_amount', 'coverage_limit', 'recent_policy', 'suspicious_timing', 'duplicate_claim'] }).notNull(),
	severity: text('severity', { enum: ['low', 'medium', 'high'] }).notNull(),
	description: text('description').notNull(),
	metadata: text('metadata'),
	isResolved: integer('is_resolved', { mode: 'boolean' }).notNull().default(false),
	resolvedBy: text('resolved_by').references(() => users.id),
	resolvedAt: text('resolved_at'),
	resolution: text('resolution'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const usersRelations = relations(users, ({ one, many }) => ({
	assignedAgent: one(users, { fields: [users.assignedAgentId], references: [users.id], relationName: 'agentCustomers' }),
	customers: many(users, { relationName: 'agentCustomers' }),
	policies: many(policies, { relationName: 'userPolicies' }),
	agentPolicies: many(policies, { relationName: 'agentPolicies' }),
	claims: many(claims, { relationName: 'userClaims' }),
	assignedClaims: many(claims, { relationName: 'adjusterClaims' }),
	underwriterClaims: many(claims, { relationName: 'underwriterClaims' }),
	documents: many(documents),
	claimNotes: many(claimNotes),
	sentMessages: many(communications, { relationName: 'sentMessages' }),
	receivedMessages: many(communications, { relationName: 'receivedMessages' }),
	notifications: many(notifications),
	sessions: many(sessions),
	auditLogs: many(auditLogs)
}));

export const policiesRelations = relations(policies, ({ one, many }) => ({
	user: one(users, { fields: [policies.userId], references: [users.id], relationName: 'userPolicies' }),
	agent: one(users, { fields: [policies.agentId], references: [users.id], relationName: 'agentPolicies' }),
	underwriter: one(users, { fields: [policies.underwriterId], references: [users.id] }),
	claims: many(claims),
	documents: many(documents),
	notifications: many(notifications)
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
	policy: one(policies, { fields: [claims.policyId], references: [policies.id] }),
	user: one(users, { fields: [claims.userId], references: [users.id], relationName: 'userClaims' }),
	adjuster: one(users, { fields: [claims.assignedAdjusterId], references: [users.id], relationName: 'adjusterClaims' }),
	underwriter: one(users, { fields: [claims.underwriterId], references: [users.id], relationName: 'underwriterClaims' }),
	documents: many(documents),
	notes: many(claimNotes),
	communications: many(communications),
	notifications: many(notifications),
	workflowHistory: many(claimWorkflowHistory),
	settlementCalculations: many(settlementCalculations),
	fraudAlerts: many(fraudAlerts)
}));

export const claimNotesRelations = relations(claimNotes, ({ one }) => ({
	claim: one(claims, { fields: [claimNotes.claimId], references: [claims.id] }),
	user: one(users, { fields: [claimNotes.userId], references: [users.id] })
}));

export const documentsRelations = relations(documents, ({ one }) => ({
	claim: one(claims, { fields: [documents.claimId], references: [claims.id] }),
	policy: one(policies, { fields: [documents.policyId], references: [policies.id] }),
	user: one(users, { fields: [documents.userId], references: [users.id] }),
	verifier: one(users, { fields: [documents.verifiedBy], references: [users.id] })
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
	claim: one(claims, { fields: [communications.claimId], references: [claims.id] }),
	sender: one(users, { fields: [communications.senderId], references: [users.id], relationName: 'sentMessages' }),
	recipient: one(users, { fields: [communications.recipientId], references: [users.id], relationName: 'receivedMessages' })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, { fields: [notifications.userId], references: [users.id] }),
	claim: one(claims, { fields: [notifications.relatedClaimId], references: [claims.id] }),
	policy: one(policies, { fields: [notifications.relatedPolicyId], references: [policies.id] })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, { fields: [auditLogs.userId], references: [users.id] })
}));

export const claimWorkflowHistoryRelations = relations(claimWorkflowHistory, ({ one }) => ({
	claim: one(claims, { fields: [claimWorkflowHistory.claimId], references: [claims.id] }),
	user: one(users, { fields: [claimWorkflowHistory.userId], references: [users.id] })
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
	document: one(documents, { fields: [documentVersions.documentId], references: [documents.id] }),
	uploader: one(users, { fields: [documentVersions.uploadedBy], references: [users.id] })
}));

export const settlementCalculationsRelations = relations(settlementCalculations, ({ one }) => ({
	claim: one(claims, { fields: [settlementCalculations.claimId], references: [claims.id] }),
	calculator: one(users, { fields: [settlementCalculations.calculatedBy], references: [users.id] })
}));

export const policyRenewalsRelations = relations(policyRenewals, ({ one }) => ({
	policy: one(policies, { fields: [policyRenewals.policyId], references: [policies.id] }),
	reviewer: one(users, { fields: [policyRenewals.reviewedBy], references: [users.id] })
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
	communication: one(communications, { fields: [messageAttachments.communicationId], references: [communications.id] })
}));

export const fraudAlertsRelations = relations(fraudAlerts, ({ one }) => ({
	claim: one(claims, { fields: [fraudAlerts.claimId], references: [claims.id] }),
	resolver: one(users, { fields: [fraudAlerts.resolvedBy], references: [users.id] })
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type ClaimNote = typeof claimNotes.$inferSelect;
export type NewClaimNote = typeof claimNotes.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Communication = typeof communications.$inferSelect;
export type NewCommunication = typeof communications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type ClaimWorkflowHistory = typeof claimWorkflowHistory.$inferSelect;
export type NewClaimWorkflowHistory = typeof claimWorkflowHistory.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type NewDocumentVersion = typeof documentVersions.$inferInsert;
export type SettlementCalculation = typeof settlementCalculations.$inferSelect;
export type NewSettlementCalculation = typeof settlementCalculations.$inferInsert;
export type PolicyRenewal = typeof policyRenewals.$inferSelect;
export type NewPolicyRenewal = typeof policyRenewals.$inferInsert;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type NewMessageAttachment = typeof messageAttachments.$inferInsert;
export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type NewFraudAlert = typeof fraudAlerts.$inferInsert;

export type UserRole = 'policyholder' | 'adjuster' | 'agent' | 'underwriter' | 'admin';
export type ClaimStatus = 'draft' | 'filed' | 'under_review' | 'investigation' | 'estimation' | 'pending_approval' | 'approved' | 'denied' | 'payment_pending' | 'paid' | 'closed' | 'reopened';
