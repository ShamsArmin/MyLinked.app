import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  const [storedHash, salt] = hashed.split(".");
  if (!storedHash || !salt) return false;
  const hashedBuf = Buffer.from(storedHash, "hex");
  const suppliedBuf = (await scryptAsync(plain, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
