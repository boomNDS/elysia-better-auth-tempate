import { createHash } from "node:crypto";
import { appConfig } from "../config";
import { prisma } from "../lib/prisma";

const MAX_ACTIVE_TOKENS = 5;

const digestToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");

export const createRefreshToken = async (userId: string) => {
	const activeCount = await prisma.refreshToken.count({
		where: {
			userId,
			revoked: false,
			expiresAt: { gt: new Date() },
		},
	});

	if (activeCount >= MAX_ACTIVE_TOKENS) {
		const oldest = await prisma.refreshToken.findMany({
			where: {
				userId,
				revoked: false,
			},
			orderBy: { createdAt: "asc" },
			take: 1,
		});

		if (oldest[0]) {
			await prisma.refreshToken.update({
				where: { id: oldest[0].id },
				data: { revoked: true, lastUsedAt: new Date() },
			});
		}
	}

	const token = crypto.randomUUID() + crypto.randomUUID();
	const tokenDigest = digestToken(token);
	const tokenHash = await Bun.password.hash(token, {
		algorithm: "bcrypt",
		cost: 10,
	});

	await prisma.refreshToken.create({
		data: {
			userId,
			tokenDigest,
			tokenHash,
			expiresAt: new Date(Date.now() + appConfig.refreshTtlMs),
		},
	});

	return token;
};

export const rotateRefreshToken = async (
	currentToken: string,
	userId?: string,
) => {
	const digest = digestToken(currentToken);

	const record = await prisma.refreshToken.findFirst({
		where: {
			tokenDigest: digest,
			expiresAt: { gt: new Date() },
			revoked: false,
			...(userId ? { userId } : {}),
		},
	});

	if (!record) return null;

	const ok = await Bun.password.verify(currentToken, record.tokenHash);
	if (!ok) return null;

	const newToken = crypto.randomUUID() + crypto.randomUUID();
	const newDigest = digestToken(newToken);
	const newHash = await Bun.password.hash(newToken, {
		algorithm: "bcrypt",
		cost: 10,
	});

	await prisma.$transaction([
		prisma.refreshToken.update({
			where: { id: record.id },
			data: { revoked: true, lastUsedAt: new Date() },
		}),
		prisma.refreshToken.create({
			data: {
				userId: record.userId,
				tokenDigest: newDigest,
				tokenHash: newHash,
				expiresAt: new Date(Date.now() + appConfig.refreshTtlMs),
			},
		}),
	]);

	return { newToken, record };
};

export const revokeAllRefreshTokens = async (userId: string) => {
	await prisma.refreshToken.updateMany({
		where: { userId, revoked: false },
		data: { revoked: true, lastUsedAt: new Date() },
	});
};

export const revokeRefreshToken = async (token: string) => {
	const digest = digestToken(token);
	const record = await prisma.refreshToken.findUnique({
		where: { tokenDigest: digest },
	});

	if (!record) return false;

	await prisma.refreshToken.update({
		where: { id: record.id },
		data: { revoked: true, lastUsedAt: new Date() },
	});

	return true;
};
