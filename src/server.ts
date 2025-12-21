import { createApp } from "./app";
import { appConfig } from "./config";
import { appLogger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const { port } = appConfig;

export const startServer = (p = port) => {
	const app = createApp();

	const server = app.listen(p, ({ hostname, port: boundPort }) => {
		appLogger.log(
			`Elysia is running at http://${hostname}:${boundPort}`,
			"Buddy",
		);
		appLogger.log(
			`Elysia listening on http://${hostname}:${boundPort} (pid ${process.pid})`,
			"Server",
		);
		appLogger.log(
			`Docs: http://${hostname}:${boundPort}/docs | Auth: http://${hostname}:${boundPort}${appConfig.authBasePath}`,
			"Server",
		);
	});

	const shutdown = async (signal: string) => {
		appLogger.warn(`Received ${signal}, shutting down gracefully`, "Server");
		try {
			if (typeof server?.stop === "function") {
				await server.stop();
			}
		} catch (err) {
			appLogger.error(`Error stopping server: ${err}`, "Server");
		}

		try {
			await prisma.$disconnect();
		} catch (err) {
			appLogger.error(`Error disconnecting Prisma: ${err}`, "Server");
		}

		process.exit(0);
	};

	for (const signal of ["SIGINT", "SIGTERM"]) {
		process.on(signal, () => {
			void shutdown(signal);
		});
	}

	return server;
};

if (import.meta.main) {
	startServer();
}
