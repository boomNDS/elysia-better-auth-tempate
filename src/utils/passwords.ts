import { createHash } from "node:crypto";

import { pwnedPasswordRange } from "hibp";

const MIN_LENGTH = 12;
const UPPER_REGEX = /[A-Z]/;
const LOWER_REGEX = /[a-z]/;
const DIGIT_REGEX = /[0-9]/;
const SYMBOL_REGEX = /[^A-Za-z0-9]/;

export const checkPasswordComplexity = (password: string) => {
	const errors: string[] = [];
	if (password.length < MIN_LENGTH)
		errors.push(`must be at least ${MIN_LENGTH} characters`);
	if (!UPPER_REGEX.test(password))
		errors.push("must include an uppercase letter");
	if (!LOWER_REGEX.test(password))
		errors.push("must include a lowercase letter");
	if (!DIGIT_REGEX.test(password)) errors.push("must include a digit");
	if (!SYMBOL_REGEX.test(password)) errors.push("must include a symbol");
	return { ok: errors.length === 0, errors };
};

export const checkPwnedPassword = async (password: string) => {
	const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
	const prefix = sha1.slice(0, 5);
	const suffix = sha1.slice(5);

	const results = await pwnedPasswordRange(prefix);
	const count = results[suffix] ?? 0;

	return {
		compromised: count > 0,
		count,
	};
};
