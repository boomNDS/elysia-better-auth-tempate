import { SignJWT } from "jose";

import { appConfig } from "../config";

const key = new TextEncoder().encode(appConfig.jwtSecret);

export const signAccessToken = async (userId: string, email: string) => {
	return new SignJWT({ sub: userId, email })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuer("elysia-auth")
		.setAudience("elysia-users")
		.setExpirationTime(appConfig.accessTtl)
		.setIssuedAt()
		.sign(key);
};
