import { Elysia } from "elysia";
import { appConfig } from "../config";
import { appLogger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import {
	forgotPasswordSchema,
	loginSchema,
	refreshSchema,
	resetPasswordSchema,
	revokeRefreshSchema,
	signupSchema,
} from "../schemas/auth";
import { authService } from "../services/auth";
import { sendVerificationEmailLink } from "../services/email";
import {
	createRefreshToken,
	revokeAllRefreshTokens,
	revokeRefreshToken,
	rotateRefreshToken,
} from "../services/refresh-tokens";
import { signAccessToken } from "../services/tokens";
import { AuthSession, requireSession } from "../utils/auth";
import {
	checkPasswordComplexity,
	checkPwnedPassword,
} from "../utils/passwords";

export const authRouter = new Elysia({ name: "authRoutes" })
	// Better Auth router passthrough (handles /auth/*)
	.all("/auth/*", async ({ request }) => authService.handler(request))
	.post(
		"/auth/forgot-password",
		async ({ request }) => authService.handler(request),
		{
			body: forgotPasswordSchema,
			detail: {
				summary: "Request a password reset token (email sent if user exists)",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/reset-password",
		async ({ body, request, set }) => {
			const passwordRecommendations: string[] = [];
			const complexity = checkPasswordComplexity(body.password);
			if (!complexity.ok) {
				passwordRecommendations.push(...complexity.errors);
			}

			if (appConfig.signupPwnedChecks) {
				try {
					const pwned = await checkPwnedPassword(body.password);
					if (pwned.compromised) {
						passwordRecommendations.push("avoid known breached passwords");
					}
				} catch {
					// Best-effort recommendation only.
				}
			}

			const { response, headers } = await authService.api.resetPassword({
				body: {
					token: body.token,
					newPassword: body.password,
				},
				headers: request.headers,
				returnHeaders: true,
			});

			const responseHeaders: Record<string, string> = {};
			headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});
			set.headers = responseHeaders;

			return {
				status: response.status,
				passwordRecommendations,
			};
		},
		{
			body: resetPasswordSchema,
			detail: {
				summary: "Reset password with a valid reset token",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/login",
		async ({ body, request, set }) => {
			const { response: signInResult, headers } =
				await authService.api.signInEmail({
					body,
					headers: request.headers,
					returnHeaders: true,
				});

			if (
				appConfig.emailVerificationEnforce &&
				!signInResult.user.emailVerified
			) {
				return new Response("Email not verified", { status: 403 });
			}

			const refreshToken = await createRefreshToken(signInResult.user.id);

			await prisma.user.update({
				where: { id: signInResult.user.id },
				data: {
					lastLoginAt: new Date(),
				},
			});

			// Generate JWT token using our custom signer (Better Auth JWT plugin doesn't return token in signInEmail response)
			const accessToken = await signAccessToken(
				signInResult.user.id,
				signInResult.user.email,
			);

			set.headers = Object.fromEntries(headers);

			return {
				accessToken,
				refreshToken,
				user: signInResult.user,
			};
		},
		{
			body: loginSchema,
			detail: {
				summary:
					"Sign in with email/password (Better Auth) and issue refresh token",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/signup",
		async ({ body, request, set }) => {
			const passwordRecommendations: string[] = [];
			const complexity = checkPasswordComplexity(body.password);
			if (!complexity.ok) {
				passwordRecommendations.push(...complexity.errors);
			}

			if (appConfig.signupPwnedChecks) {
				try {
					const pwned = await checkPwnedPassword(body.password);
					if (pwned.compromised) {
						passwordRecommendations.push("avoid known breached passwords");
					}
				} catch {
					// Best-effort recommendation only.
				}
			}

			const { response, headers } = await authService.api.signUpEmail({
				body,
				headers: request.headers,
				returnHeaders: true,
			});

			// Ensure role and set login timestamp (best-effort)
			await prisma.user.updateMany({
				where: { id: response.user.id },
				data: { role: "user", lastLoginAt: new Date() },
			});

			set.headers = Object.fromEntries(headers);

			const refreshToken = await createRefreshToken(response.user.id);

			// Generate JWT token using our custom signer (Better Auth JWT plugin doesn't return token in signUpEmail response)
			const accessToken = await signAccessToken(
				response.user.id,
				response.user.email,
			);

			return {
				...response,
				accessToken,
				refreshToken,
				passwordRecommendations,
				message: appConfig.emailVerification
					? "Verification email sent. Please verify before signing in."
					: "Signup successful.",
			};
		},
		{
			body: signupSchema,
			detail: {
				summary: "Sign up with email/password and set default user role",
				tags: ["auth"],
			},
		},
	)
	.use(requireSession())
	.post(
		"/auth/refresh",
		async (ctx) => {
			const { body, session } = ctx as typeof ctx & {
				body: { refreshToken: string };
				session: AuthSession;
			};
			const rotated = await rotateRefreshToken(body.refreshToken);

			if (!rotated) {
				return new Response("Invalid refresh token", { status: 401 });
			}

			const user = await prisma.user.findUnique({
				where: { id: rotated.record.userId },
			});

			if (!user) {
				return new Response("User not found", { status: 404 });
			}

			const accessToken = await signAccessToken(user.id, user.email);

			return {
				accessToken,
				refreshToken: rotated.newToken,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
				},
			};
		},
		{
			body: refreshSchema,
			detail: {
				summary: "Exchange refresh token for new access/refresh pair",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/refresh/revoke",
		async ({ body }) => {
			const ok = await revokeRefreshToken(body.refreshToken);
			if (!ok) return new Response("Invalid refresh token", { status: 404 });
			return { success: true };
		},
		{
			body: revokeRefreshSchema,
			detail: {
				summary: "Revoke a specific refresh token",
				tags: ["auth"],
			},
		},
	)
	.get(
		"/auth/me",
		(ctx) => {
			const { session } = ctx as typeof ctx & { session: AuthSession };
			return { session };
		},
		{
			detail: {
				summary: "Inspect current Better Auth session",
				tags: ["auth"],
			},
		},
	)
	.get(
		"/auth/sessions",
		async (ctx) => {
			const { session, request } = ctx as typeof ctx & { session: AuthSession };
			const sessions = await authService.api.listSessions({
				headers: request.headers,
			});

			return { sessions, viewer: session.user };
		},
		{
			detail: {
				summary: "List active sessions for current user",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/logout",
		async (ctx) => {
			const { session, request, set } = ctx as typeof ctx & {
				session: AuthSession;
			};

			await revokeAllRefreshTokens(session.user.id);

			const { headers } = await authService.api.signOut({
				headers: request.headers,
				returnHeaders: true,
			});

			set.headers = Object.fromEntries(headers);

			return { success: true };
		},
		{
			detail: {
				summary: "Sign out and revoke refresh tokens",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/logout-all",
		async (ctx) => {
			const { session, request, set } = ctx as typeof ctx & {
				session: AuthSession;
			};

			await revokeAllRefreshTokens(session.user.id);

			const { headers } = await authService.api.revokeSessions({
				headers: request.headers,
				returnHeaders: true,
			});

			set.headers = Object.fromEntries(headers);

			return { success: true };
		},
		{
			detail: {
				summary: "Revoke all sessions and refresh tokens",
				tags: ["auth"],
			},
		},
	)
	.post(
		"/auth/session/revoke",
		async (ctx) => {
			const { request, set, session } = ctx as typeof ctx & {
				session: AuthSession;
			};

			const { headers } = await authService.api.revokeSession({
				headers: request.headers,
				body: { token: session.session.token },
				returnHeaders: true,
			});

			set.headers = Object.fromEntries(headers.entries());

			return { success: true };
		},
		{
			detail: {
				summary: "Revoke current session",
				tags: ["auth"],
			},
		},
	)
	.use(requireSession())
	.onError(({ error }) => {
		if (error instanceof Error) {
			appLogger.error(error.message, "Auth");
		}
	});
