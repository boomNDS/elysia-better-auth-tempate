import { render } from "@react-email/render";
import React from "react";
import { Resend } from "resend";

import { appConfig } from "../config";
import ResetPasswordEmail from "../emails/ResetPasswordEmail";
import VerifyEmail from "../emails/VerifyEmail";
import WelcomeEmail from "../emails/WelcomeEmail";
import { appLogger } from "../lib/logger";

const resendApiKey = appConfig.resendApiKey;
const emailFrom = appConfig.emailFrom;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendWelcomeEmail = async (to: string, name?: string) => {
	if (!resend) {
		throw new Error("RESEND_API_KEY is not configured");
	}

	const html = await render(<WelcomeEmail name={name} />);

	const { error } = await resend.emails.send({
		from: emailFrom,
		to,
		subject: `Welcome${name ? `, ${name}` : ""}!`,
		html,
	});

	if (error) {
		appLogger.error(`Failed to send email: ${error.message}`, "Email");
		throw new Error(error.message);
	}

	appLogger.log(`Sent welcome email to ${to}`, "Email");
};

export const sendVerificationEmailLink = async (
	to: string,
	url: string,
	name?: string,
) => {
	if (!resend) {
		throw new Error("RESEND_API_KEY is not configured");
	}

	const html = await render(<VerifyEmail name={name} url={url} />);

	const { error } = await resend.emails.send({
		from: emailFrom,
		to,
		subject: "Verify your email",
		html,
	});

	if (error) {
		appLogger.error(
			`Failed to send verification email: ${error.message}`,
			"Email",
		);
		throw new Error(error.message);
	}

	appLogger.log(`Sent verification email to ${to}`, "Email");
};

export const sendResetPasswordEmailLink = async (
	to: string,
	url: string,
	token: string,
	name?: string,
) => {
	if (!resend) {
		appLogger.warn(
			"RESEND_API_KEY is not configured; skipping reset email",
			"Email",
		);
		return;
	}

	const html = await render(
		<ResetPasswordEmail name={name} url={url} token={token} />,
	);

	const { error } = await resend.emails.send({
		from: emailFrom,
		to,
		subject: "Reset your password",
		html,
	});

	if (error) {
		appLogger.error(
			`Failed to send reset password email: ${error.message}`,
			"Email",
		);
		throw new Error(error.message);
	}

	appLogger.log(`Sent reset password email to ${to}`, "Email");
};
