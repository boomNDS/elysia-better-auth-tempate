import { Elysia } from "elysia";

export const securityHeaders = () =>
	new Elysia().on("request", ({ set }) => {
		set.headers ||= {};
		set.headers["x-content-type-options"] = "nosniff";
		set.headers["x-frame-options"] = "DENY";
		set.headers["referrer-policy"] = "no-referrer";
		set.headers["cross-origin-opener-policy"] = "same-origin";
		if (process.env.NODE_ENV === "production") {
			set.headers["strict-transport-security"] =
				"max-age=63072000; includeSubDomains; preload";
		}
	});
