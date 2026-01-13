import { webcrypto } from 'node:crypto';

const ITERATIONS = 100_000;
const HASH = 'SHA-256';
const KEYLEN_BITS = 256;

function b64(u8) {
  return Buffer.from(u8).toString('base64');
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));

  const key = await webcrypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: HASH, salt, iterations: ITERATIONS },
    key,
    KEYLEN_BITS
  );

  const hash = new Uint8Array(bits);

  // PBKDF2$100000$<saltB64>$<hashB64>
  return `PBKDF2$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node tools/make-user.mjs <email> <password>');
  process.exit(1);
}

const password_hash = await hashPassword(password);
console.log(JSON.stringify({ email, password_hash }, null, 2));
