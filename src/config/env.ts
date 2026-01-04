import "dotenv/config";
import { z } from "zod";

const envSchema = z
	.object({
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		APP_ENCRYPTION_KEY: z
			.string()
			.min(1, "APP_ENCRYPTION_KEY is required (32-byte base64 or hex)"),
		PORT: z.string().optional(),
		WORKERS: z.string().optional(),
		JWT_SECRET: z
			.string()
			.optional()
			.refine(
				(val) => !val || val.length >= 32,
				"JWT_SECRET must be at least 32 characters",
			),
		BETTER_AUTH_SECRET: z
			.string()
			.optional()
			.refine(
				(val) => !val || val.length >= 32,
				"BETTER_AUTH_SECRET must be at least 32 characters",
			),
		REFRESH_TOKEN_TTL_MS: z.string().optional(),
		JWT_EXPIRATION: z.string().optional(),
		CORS_ORIGINS: z.string().optional(),
		RATE_LIMIT_WINDOW_MS: z.string().optional(),
		RATE_LIMIT_MAX: z.string().optional(),
		LOG_LEVEL: z.string().optional(),
		AUTH_BASE_URL: z.string().optional(),
		RESEND_API_KEY: z.string().optional(),
		EMAIL_FROM: z.string().optional(),
		ADMIN_EMAILS: z.string().optional(),
		ADMIN_ROLE: z.string().optional(),
		EMAIL_VERIFICATION: z
			.enum(["true", "false"])
			.optional()
			.transform((v) => v === "true"),
		EMAIL_VERIFICATION_ENFORCE: z
			.enum(["true", "false"])
			.optional()
			.transform((v) => v === "true"),
		SIGNUP_MIN_PASSWORD_LENGTH: z.string().optional(),
		SIGNUP_PWNED_CHECKS: z
			.enum(["true", "false"])
			.optional()
			.transform((v) => v === "true"),
		SIGNUP_RATE_LIMIT_WINDOW_MS: z.string().optional(),
		SIGNUP_RATE_LIMIT_MAX: z.string().optional(),
		DATABASE_URL: z.string(),
	})
	.refine(
		(data) => Boolean(data.JWT_SECRET ?? data.BETTER_AUTH_SECRET),
		"JWT_SECRET or BETTER_AUTH_SECRET is required",
	);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Invalid environment configuration");
	console.error(parsed.error.format());
	process.exit(1);
}

export const env = parsed.data;
