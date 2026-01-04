import { t } from "elysia";
import { appConfig } from "../config";

export const loginSchema = t.Object({
	email: t.String({ format: "email" }),
	password: t.String({ minLength: 6 }),
});

export const refreshSchema = t.Object({
	refreshToken: t.String({ minLength: 10 }),
});

export const revokeRefreshSchema = refreshSchema;

export const signupSchema = t.Object({
	email: t.String({ format: "email" }),
	password: t.String({ minLength: appConfig.signupMinPasswordLength }),
	name: t.String({ minLength: 1 }),
});

export const forgotPasswordSchema = t.Object({
	email: t.String({ format: "email" }),
});

export const resetPasswordSchema = t.Object({
	token: t.String({ minLength: 10 }),
	password: t.String({ minLength: appConfig.signupMinPasswordLength }),
});
