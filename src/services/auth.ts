import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { bearer } from "better-auth/plugins/bearer";
import { jwt as jwtPlugin } from "better-auth/plugins/jwt";

import { appConfig } from "../config";
import { prisma } from "../lib/prisma";
import { sendResetPasswordEmailLink, sendVerificationEmailLink } from "./email";

const AUTH_SECRET = appConfig.jwtSecret;
const ACCESS_TOKEN_TTL = appConfig.accessTtl;

export const authService = betterAuth({
	appName: "Buddy Auth",
	basePath: appConfig.authBasePath,
	baseURL: appConfig.authBaseUrl,
	secret: AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		resetPasswordTokenExpiresIn: 60 * 30, // 30 minutes
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url, token }) => {
			await sendResetPasswordEmailLink(user.email, url, token, user.name);
		},
	},
	emailVerification: {
		sendOnSignUp: appConfig.emailVerification,
		sendOnSignIn: appConfig.emailVerification,
		autoSignInAfterVerification: false,
		requireEmailVerification: appConfig.emailVerificationEnforce,
		sendVerificationEmail: appConfig.emailVerification
			? async ({ user, url }) => {
					await sendVerificationEmailLink(
						user.email,
						url,
						user.name ?? user.email,
					);
				}
			: undefined,
	},
	advanced: {
		cookiePrefix: "elysia",
		cookies: {
			session_token: {
				name: "elysia_session",
				attributes: {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
				},
			},
		},
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
		transaction: true,
		debugLogs: false,
	}),
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Best-effort: Better Auth may create users inside a transaction.
					// Using `update()` here can throw P2025 if this client can't see the uncommitted row yet.
					// Also `role` already has a schema default; we only try to set lastLoginAt.
					await prisma.user.updateMany({
						where: { id: user.id },
						data: { lastLoginAt: new Date() },
					});
				},
			},
		},
	},
	plugins: [
		jwtPlugin({
			jwt: {
				expirationTime: ACCESS_TOKEN_TTL,
				issuer: "elysia-auth",
			},
		}),
		bearer({ requireSignature: false }),
		admin({
			adminRoles: appConfig.adminRole,
			adminUserIds: appConfig.adminEmails,
		}),
	],
});
