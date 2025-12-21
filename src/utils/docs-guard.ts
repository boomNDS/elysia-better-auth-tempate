import { Elysia } from "elysia";

import { appConfig } from "../config";
import { appLogger } from "../lib/logger";
import { authService } from "../services/auth";

export const docsGuard = () => {
	if (appConfig.nodeEnv !== "production") return new Elysia();

	const adminRole = appConfig.adminRole;
	const allowlist = appConfig.adminEmails;

	return new Elysia().derive(async ({ request }) => {
		if (!request.url.includes("/docs")) return {};

		const session = await authService.api.getSession({
			headers: request.headers,
		});

		if (!session) throw new Response("Unauthorized", { status: 401 });

		const roles: string[] = (() => {
			const candidate =
				(session as any).user?.roles ?? (session as any).user?.role;
			if (!candidate) return [];
			return Array.isArray(candidate) ? candidate : [candidate];
		})();

		const hasRole = roles.includes(adminRole);
		const isAllowlisted =
			allowlist.length === 0 ? false : allowlist.includes(session.user.email);

		if (!hasRole && !isAllowlisted) {
			appLogger.warn(
				`Docs access denied for ${session.user.email}`,
				"DocsGuard",
			);
			throw new Response("Forbidden", { status: 403 });
		}

		return { session };
	});
};
