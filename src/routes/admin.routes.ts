import { Elysia } from "elysia";

import { prisma } from "../lib/prisma";
import { AuthSession, requireAdmin } from "../utils/auth";

export const adminRouter = new Elysia({ name: "adminRoutes" })
	.use(requireAdmin())
	.guard(
		{
			detail: {
				tags: ["admin"],
			},
		},
		(app) =>
			app.get(
				"/admin/users",
				async (ctx) => {
					const { session } = ctx as typeof ctx & { session: AuthSession };
					const users = await prisma.user.findMany({
						include: {
							accounts: true,
							sessions: true,
							refreshTokens: true,
						},
						orderBy: { createdAt: "desc" },
					});

					return { users, viewer: session.user };
				},
				{
					detail: {
						summary: "List users from Prisma for visibility",
					},
				},
			),
	);
