import { Elysia } from "elysia";

import { sendEmailSchema } from "../schemas/email";
import { sendWelcomeEmail } from "../services/email";

export const emailRouter = new Elysia({ name: "emailRoutes" }).post(
	"/email/send",
	async ({ body }) => {
		await sendWelcomeEmail(body.to, body.name);

		return {
			sent: true,
		};
	},
	{
		body: sendEmailSchema,
		detail: {
			summary: "Send welcome email via Resend using React Email template",
			tags: ["email"],
		},
	},
);
