import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import pg from "pg";
import { appConfig } from "../config";
import { decryptString, encryptString } from "../utils/encryption";

declare global {
	// eslint-disable-next-line no-var
	var __prisma: ReturnType<typeof createClient> | undefined;
}

// Prisma 7 requires driver adapters; use pg Pool + PrismaPg
const pool = new pg.Pool({
	connectionString: appConfig.databaseUrl,
});

const encryptedAccountFields = [
	"accessToken",
	"refreshToken",
	"idToken",
] as const;

const encryptAccountData = <T>(data: T): T => {
	const next: Record<string, unknown> = {
		...(data as Record<string, unknown>),
	};
	for (const field of encryptedAccountFields) {
		if (next[field]) {
			next[field] = encryptString(String(next[field]));
		}
	}
	return next as T;
};

const decryptAccountField = (value: string | null | undefined) => {
	if (!value) return value;
	return decryptString(value);
};

type AccountTokenFields = {
	accessToken?: string | null;
	refreshToken?: string | null;
	idToken?: string | null;
};

const createClient = () => {
	const baseClient = new PrismaClient({ adapter: new PrismaPg(pool) });

	return baseClient.$extends({
		query: {
			account: {
				async create({
					args,
					query,
				}: {
					args: Prisma.AccountCreateArgs;
					query: (args: Prisma.AccountCreateArgs) => unknown;
				}) {
					if (args.data) {
						args.data = encryptAccountData(args.data);
					}
					return query(args);
				},
				async update({
					args,
					query,
				}: {
					args: Prisma.AccountUpdateArgs;
					query: (args: Prisma.AccountUpdateArgs) => unknown;
				}) {
					if (args.data) {
						args.data = encryptAccountData(args.data);
					}
					return query(args);
				},
				async upsert({
					args,
					query,
				}: {
					args: Prisma.AccountUpsertArgs;
					query: (args: Prisma.AccountUpsertArgs) => unknown;
				}) {
					if (args.create) {
						args.create = encryptAccountData(args.create);
					}
					if (args.update) {
						args.update = encryptAccountData(args.update);
					}
					return query(args);
				},
				async createMany({
					args,
					query,
				}: {
					args: Prisma.AccountCreateManyArgs;
					query: (args: Prisma.AccountCreateManyArgs) => unknown;
				}) {
					if (Array.isArray(args.data)) {
						args.data = args.data.map((item: Prisma.AccountCreateManyInput) =>
							encryptAccountData(item),
						);
					} else if (args.data) {
						args.data = encryptAccountData(args.data);
					}
					return query(args);
				},
				async updateMany({
					args,
					query,
				}: {
					args: Prisma.AccountUpdateManyArgs;
					query: (args: Prisma.AccountUpdateManyArgs) => unknown;
				}) {
					if (args.data) {
						args.data = encryptAccountData(args.data);
					}
					return query(args);
				},
			},
		},
		result: {
			account: {
				accessToken: {
					needs: { accessToken: true },
					compute: (account: AccountTokenFields) =>
						decryptAccountField(account.accessToken),
				},
				refreshToken: {
					needs: { refreshToken: true },
					compute: (account: AccountTokenFields) =>
						decryptAccountField(account.refreshToken),
				},
				idToken: {
					needs: { idToken: true },
					compute: (account: AccountTokenFields) =>
						decryptAccountField(account.idToken),
				},
			},
		},
	});
};

const prismaClient = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma = prismaClient;
}

export const prisma = prismaClient;
