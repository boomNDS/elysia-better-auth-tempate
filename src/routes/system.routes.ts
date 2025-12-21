import { Elysia } from "elysia";

export const systemRouter = new Elysia({ name: "systemRoutes" }).get(
	"/health",
	() => ({
		status: "ok",
		uptimeMs: Math.round(process.uptime() * 1000),
	}),
	{
		detail: {
			summary: "Health check",
			tags: ["system"],
		},
	},
);
