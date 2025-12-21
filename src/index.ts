import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";
import { appConfig } from "./config";
import { appLogger } from "./lib/logger";
import { startServer } from "./server";

const workers =
	appConfig.workers > 0 ? appConfig.workers : os.availableParallelism();
const port = appConfig.port;

if (cluster.isPrimary) {
	appLogger.log(
		`Primary ${process.pid} starting ${workers} workers on port ${port}`,
		"Cluster",
	);

	for (let i = 0; i < workers; i += 1) {
		cluster.fork();
	}

	cluster.on("exit", (worker, code, signal) => {
		appLogger.warn(
			`Worker ${worker.process.pid} exited (${signal ?? code ?? "unknown"}); restarting`,
			"Cluster",
		);
		cluster.fork();
	});
} else {
	startServer(port);
	appLogger.log(`Worker ${process.pid} ready`, "Cluster");
}
