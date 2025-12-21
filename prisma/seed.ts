import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_USER = {
	email: "admin@example.com",
	password: "changeme123",
	name: "Admin User",
	role: process.env.SEED_ADMIN_ROLE ?? "admin",
};

const seed = async () => {
	const hashed = await Bun.password.hash(DEFAULT_USER.password, {
		algorithm: "bcrypt",
		cost: 10,
	});

	const user = await prisma.user.upsert({
		where: { email: DEFAULT_USER.email },
		update: {
			password: hashed,
			name: DEFAULT_USER.name,
			emailVerified: true,
			role: DEFAULT_USER.role,
		},
		create: {
			email: DEFAULT_USER.email,
			password: hashed,
			name: DEFAULT_USER.name,
			emailVerified: true,
			role: DEFAULT_USER.role,
		},
	});

	console.log(`Seeded user ${user.email} (id=${user.id})`);
};

seed()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
