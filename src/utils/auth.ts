import { Elysia } from "elysia";
import { appConfig } from "../config";
import { authService } from "../services/auth";

export type AuthSession = NonNullable<
	Awaited<ReturnType<typeof authService.api.getSession>>
>;

export const requireSession = () =>
	new Elysia().derive<{ session: AuthSession }, "scoped">(
		{ as: "scoped" },
		async ({ request }) => {
			const session = await authService.api.getSession({
				headers: request.headers,
			});

			if (!session) {
				throw new Response("Unauthorized", { status: 401 });
			}

			return { session };
		},
	);

export const requireAdmin = () =>
	requireSession().derive<{ session: AuthSession }, "scoped">(
		{ as: "scoped" },
		(ctx) => {
			const { session } = ctx;
			const allowlist = appConfig.adminEmails;
			const roles: string[] = (() => {
				const candidate =
					(session as any).user?.roles ?? (session as any).user?.role;
				if (!candidate) return [];
				return Array.isArray(candidate) ? candidate : [candidate];
			})();

			const hasRole = roles.includes(appConfig.adminRole);
			const isAllowlisted =
				allowlist.length === 0 ? false : allowlist.includes(session.user.email);

			if (!hasRole && allowlist.length > 0 && !isAllowlisted) {
				throw new Response("Forbidden", { status: 403 });
			} else if (!hasRole && allowlist.length === 0) {
				throw new Response("Forbidden", { status: 403 });
			}

			return { session };
		},
	);
