import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';
const ALGORITHM = 'aes-256-cbc';

const key = scryptSync(SECRET_KEY, 'salt', 32);

export function encrypt(text: string): string {
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

	return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
	const [ivHex, encryptedHex] = text.split(':');
	const iv = Buffer.from(ivHex, 'hex');
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(encryptedHex, 'hex')),
		decipher.final()
	]);
	return decrypted.toString('utf8');
}
