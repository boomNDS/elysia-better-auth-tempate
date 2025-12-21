import { prisma } from "../lib/prisma";

export type CleanupResult = {
	startedAt: Date;
	finishedAt: Date;
	// counts
	refreshTokensDeleted: number;
	sessionsDeleted: number;
	verificationsDeleted: number;
	rateLimitsDeleted: number;
};

// Keep these as code constants (no env needed).
const REVOKED_REFRESH_TOKEN_RETENTION_DAYS = 30;
const RATE_LIMIT_RETENTION_DAYS = 30;

export const runCleanup = async (): Promise<CleanupResult> => {
	const startedAt = new Date();
	const now = startedAt;

	const revokedRefreshCutoff = new Date(
		now.getTime() - REVOKED_REFRESH_TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1000,
	); // 30 days
	// RateLimit.lastRequest is an Int in Postgres; store/compare in seconds to avoid 32-bit overflow.
	const rateLimitCutoffSeconds = Math.floor(
		(now.getTime() - RATE_LIMIT_RETENTION_DAYS * 24 * 60 * 60 * 1000) / 1000,
	);

	// Refresh tokens:
	// - delete expired tokens
	// - delete revoked tokens older than retention window
	const refreshTokensDeleted = (
		await prisma.refreshToken.deleteMany({
			where: {
				OR: [
					{ expiresAt: { lt: now } },
					{ revoked: true, updatedAt: { lt: revokedRefreshCutoff } },
				],
			},
		})
	).count;

	// Better Auth sessions: delete expired
	const sessionsDeleted = (
		await prisma.session.deleteMany({
			where: { expiresAt: { lt: now } },
		})
	).count;

	// Better Auth email verification tokens: delete expired
	const verificationsDeleted = (
		await prisma.verification.deleteMany({
			where: { expiresAt: { lt: now } },
		})
	).count;

	// Rate limit table (generic): drop entries older than retention window
	// Note: lastRequest is stored as an integer (seconds epoch).
	const rateLimitsDeleted = (
		await prisma.rateLimit.deleteMany({
			where: { lastRequest: { lt: rateLimitCutoffSeconds } },
		})
	).count;

	return {
		startedAt,
		finishedAt: new Date(),
		refreshTokensDeleted,
		sessionsDeleted,
		verificationsDeleted,
		rateLimitsDeleted,
	};
};
