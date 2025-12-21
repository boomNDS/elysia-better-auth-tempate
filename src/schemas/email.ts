import { t } from "elysia";

export const sendEmailSchema = t.Object({
	to: t.String({ format: "email" }),
	name: t.Optional(t.String({ minLength: 1 })),
});
