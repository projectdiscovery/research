import { db } from './db';
import { users, sessions } from './db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { UserRole } from './db/schema';

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password + 'claimflow_salt_v1');
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const passwordHash = await hashPassword(password);
	return passwordHash === hash;
}

export async function createSession(userId: string, cookies: Cookies, event?: RequestEvent): Promise<string> {
	const sessionId = uuidv4();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

	await db.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt: expiresAt.toISOString(),
		ipAddress: event?.getClientAddress?.() || null,
		userAgent: event?.request?.headers?.get('user-agent') || null
	});

	await db.update(users)
		.set({ lastLoginAt: new Date().toISOString() })
		.where(eq(users.id, userId));

	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60
	});

	return sessionId;
}

export async function getSession(cookies: Cookies) {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	const session = await db.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
		with: { user: true }
	});

	if (!session) return null;

	if (new Date(session.expiresAt) < new Date()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		return null;
	}

	return session;
}

export async function destroySession(cookies: Cookies) {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
	}
}

export async function getUserByEmail(email: string) {
	return db.query.users.findFirst({
		where: eq(users.email, email.toLowerCase())
	});
}

export async function createUser(data: {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
	role?: UserRole;
	assignedAgentId?: string;
}) {
	const passwordHash = await hashPassword(data.password);
	const userId = uuidv4();

	await db.insert(users).values({
		id: userId,
		email: data.email.toLowerCase(),
		passwordHash,
		firstName: data.firstName,
		lastName: data.lastName,
		phone: data.phone,
		role: data.role || 'policyholder',
		assignedAgentId: data.assignedAgentId
	});

	return userId;
}

export function getDashboardUrl(role: UserRole): string {
	switch (role) {
		case 'admin':
			return '/admin';
		case 'adjuster':
			return '/adjuster';
		case 'agent':
			return '/agent';
		case 'underwriter':
			return '/underwriter';
		case 'policyholder':
		default:
			return '/dashboard';
	}
}
