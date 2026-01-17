import { cors } from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { logger } from "elysia-logger";
import { rateLimit } from "elysia-rate-limit";
import { appConfig } from "./config";
import { appLogger } from "./lib/logger";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { emailRouter } from "./routes/email.routes";
import { systemRouter } from "./routes/system.routes";
import { runCleanup } from "./services/cleanup";
import { docsGuard } from "./utils/docs-guard";
import { securityHeaders } from "./utils/security";

const {
	corsOrigins,
	rateLimitMax,
	rateLimitWindowMs,
	logLevel,
	signupRateLimitMax,
	signupRateLimitWindowMs,
} = appConfig;

if (appConfig.nodeEnv === "production" && corsOrigins.includes("*")) {
	throw new Error("CORS_ORIGINS must be set to explicit origins in production");
}

export const createApp = () => {
	const app = new Elysia({ name: "elysia-better-auth-tempate" })
		.use(
			openapi({
				path: "/docs",
				documentation: {
					info: {
						title: "Buddy API",
						description: "Starter Elysia service with OpenAPI documentation",
						version: "1.0.0",
					},
				},
				exclude: {
					paths: ["/auth/*"],
				},
			}),
		)
		.use(
			logger({
				context: "Buddy",
				level: logLevel,
				logDetails: false,
			}),
		)
		.use(
			cors({
				origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
				credentials: true,
			}),
		)
		.use(
			rateLimit({
				duration: rateLimitWindowMs,
				max: rateLimitMax,
				errorResponse: "Too many requests, slow down.",
				countFailedRequest: false,
			}),
		)
		.use(docsGuard())
		.use(securityHeaders())
		.use(
			cron({
				name: "cleanup",
				// Daily at midnight
				pattern: "0 0 0 * * *",
				run: async () => {
					try {
						const result = await runCleanup();
						appLogger.log(
							`cleanup done: refreshTokens=${result.refreshTokensDeleted}, sessions=${result.sessionsDeleted}, verifications=${result.verificationsDeleted}, rateLimits=${result.rateLimitsDeleted}`,
							"Cleanup",
						);
					} catch (err) {
						appLogger.error(`cleanup failed: ${err}`, "Cleanup");
					}
				},
			}),
		);

	app.use(systemRouter).use(authRouter).use(emailRouter).use(adminRouter);

	return app;
};
