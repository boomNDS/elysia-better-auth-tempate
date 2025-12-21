import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { appConfig } from "../config";

const parseKey = (key: string) => {
	if (key.length === 64) return Buffer.from(key, "hex");
	if (key.length === 44 || key.length === 32) return Buffer.from(key, "base64");
	return Buffer.from(key);
};

const key = parseKey(appConfig.encryptionKey);

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

export const encryptString = (plaintext: string) => {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGO, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptString = (payload?: string | null) => {
	if (!payload) return payload ?? "";
	const [ivB64, tagB64, dataB64] = payload.split(":");
	const iv = Buffer.from(ivB64, "base64");
	const tag = Buffer.from(tagB64, "base64");
	const data = Buffer.from(dataB64, "base64");
	const decipher = createDecipheriv(ALGO, key, iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
	return decrypted.toString("utf8");
};
