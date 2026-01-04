import { env } from "./env";

const num = (val: string | undefined, fallback: number) => {
	const parsed = Number(val);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (val: string | undefined, fallback: string[]) =>
	val
		?.split(",")
		.map((o) => o.trim())
		.filter(Boolean) || fallback;

export const appConfig = {
	encryptionKey: env.APP_ENCRYPTION_KEY,
	port: num(env.PORT, 3000),
	workers: num(env.WORKERS, 0),
	jwtSecret: env.JWT_SECRET ?? env.BETTER_AUTH_SECRET ?? "change-me",
	// Refresh token lifetime (default 30 days)
	refreshTtlMs: num(env.REFRESH_TOKEN_TTL_MS, 1000 * 60 * 60 * 24 * 30),
	accessTtl: env.JWT_EXPIRATION ?? "15m",
	corsOrigins: list(env.CORS_ORIGINS, ["*"]),
	rateLimitWindowMs: num(env.RATE_LIMIT_WINDOW_MS, 60_000),
	rateLimitMax: num(env.RATE_LIMIT_MAX, 100),
	logLevel: (env.LOG_LEVEL ?? "info") as any,
	authBasePath: "/auth",
	authBaseUrl: env.AUTH_BASE_URL,
	resendApiKey: env.RESEND_API_KEY,
	emailFrom: env.EMAIL_FROM ?? "Buddy <no-reply@example.com>",
	nodeEnv: env.NODE_ENV,
	databaseUrl: env.DATABASE_URL,
	adminEmails: list(env.ADMIN_EMAILS, []),
	adminRole: env.ADMIN_ROLE ?? "admin",
	emailVerification: env.EMAIL_VERIFICATION ?? false,
	emailVerificationEnforce: env.EMAIL_VERIFICATION_ENFORCE ?? false,
	signupMinPasswordLength: num(env.SIGNUP_MIN_PASSWORD_LENGTH, 8),
	signupPwnedChecks: env.SIGNUP_PWNED_CHECKS ?? false,
	signupRateLimitWindowMs: num(env.SIGNUP_RATE_LIMIT_WINDOW_MS, 60_000),
	signupRateLimitMax: num(env.SIGNUP_RATE_LIMIT_MAX, 5),
};
