import type { User, Session, UserRole } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: { id: string; userId: string; expiresAt: string; user: User };
		}
	}
}

export {};
