import bcrypt from 'bcrypt';

const ROUNDS = 12; // match whatever login uses; adjust if different

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
