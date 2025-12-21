import type { LoggerOptions } from "elysia-logger";
import { Logger } from "elysia-logger";

const level = process.env.LOG_LEVEL as LoggerOptions["level"] | undefined;

export const appLogger = new Logger({
	context: "Buddy",
	level,
	autoLogging: false,
});
