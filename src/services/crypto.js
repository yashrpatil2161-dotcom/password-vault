/**
 * Cryptographic & Password Generation Services
 * Uses the Web Crypto API (crypto.subtle, crypto.getRandomValues)
 * Never uses Math.random() for security operations.
 */

export const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export const DEFAULT_ITERATIONS = 250000;

/**
 * Generate a cryptographically secure random integer in range [0, max - 1]
 * Uses rejection sampling to eliminate modulo bias.
 */
export function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  if (max === 1) return 0;

  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto;
  const uint32Max = 0xffffffff;
  const limit = uint32Max - (uint32Max % max);
  const buffer = new Uint32Array(1);

  while (true) {
    cryptoObj.getRandomValues(buffer);
    if (buffer[0] < limit) {
      return buffer[0] % max;
    }
  }
}

/**
 * Generate a secure random password
 * Guarantees at least one character from each selected set.
 */
export function generatePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  const validLength = Math.max(8, Math.min(64, Number(length) || 16));

  const enabledSets = [];
  if (uppercase) enabledSets.push(CHAR_SETS.uppercase);
  if (lowercase) enabledSets.push(CHAR_SETS.lowercase);
  if (numbers) enabledSets.push(CHAR_SETS.numbers);
  if (symbols) enabledSets.push(CHAR_SETS.symbols);

  // If no sets are selected, fallback to lowercase and uppercase
  if (enabledSets.length === 0) {
    enabledSets.push(CHAR_SETS.lowercase, CHAR_SETS.uppercase);
  }

  const pool = enabledSets.join('');
  const passwordChars = [];

  // Guarantee at least one character from each selected set
  for (const set of enabledSets) {
    const idx = getSecureRandomInt(set.length);
    passwordChars.push(set[idx]);
  }

  // Fill remaining length from full pool
  while (passwordChars.length < validLength) {
    const idx = getSecureRandomInt(pool.length);
    passwordChars.push(pool[idx]);
  }

  // Shuffle the characters using Fisher-Yates with crypto randomness
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

/**
 * Evaluate password strength
 * Returns score (0-4), label, color, percentage, and suggestions.
 */
export function evaluatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      label: 'Too Short',
      color: 'var(--color-danger, #ef4444)',
      percent: 0,
      feedback: 'Enter a password to evaluate strength.',
    };
  }

  const len = password.length;
  let poolSize = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  // Approximate entropy in bits
  const entropy = len * (poolSize > 0 ? Math.log2(poolSize) : 0);

  let score = 0;
  if (len >= 8) score = 1;
  if (len >= 10) score = 2;
  if (len >= 14) score = 3;
  if (len >= 18) score = 4;

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (varietyCount >= 3 && len >= 8) {
    score = Math.max(score, 2);
  }
  if (varietyCount >= 3 && len >= 12) {
    score = Math.max(score, 3);
  }
  if (varietyCount === 4 && len >= 14) {
    score = 4;
  }

  // If password is too short, cap score
  if (len < 8) score = Math.min(score, 1);
  if (len < 6) score = 0;

  // Normalization
  score = Math.max(0, Math.min(4, score));

  const meta = [
    { label: 'Very Weak', color: '#ef4444', percent: 15, feedback: 'Too short and easily guessable.' },
    { label: 'Weak', color: '#f97316', percent: 35, feedback: 'Add numbers, symbols, and length for better security.' },
    { label: 'Moderate', color: '#eab308', percent: 60, feedback: 'Decent, but can be improved with additional length.' },
    { label: 'Strong', color: '#10b981', percent: 85, feedback: 'Strong password with solid complexity.' },
    { label: 'Very Strong', color: '#06b6d4', percent: 100, feedback: 'Excellent cryptographic resilience.' },
  ];

  return {
    score,
    entropy: Math.round(entropy),
    ...meta[score],
  };
}

/**
 * Base64 conversion helpers that safely handle Uint8Array binary buffers
 */
export function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get Crypto instance
 */
function getCrypto() {
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not supported in this environment.');
  }
  return cryptoObj;
}

/**
 * Derive an AES-GCM 256-bit encryption key from a master password and salt using PBKDF2
 */
export async function deriveKey(masterPassword, saltBytes, iterations = DEFAULT_ITERATIONS) {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);

  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt any JSON-serializable data using AES-GCM and PBKDF2
 * Generates a fresh random IV on every call.
 * Generates a new salt if existingSalt is not provided.
 */
export async function encryptData(data, masterPassword, existingSalt = null, iterations = DEFAULT_ITERATIONS) {
  if (!masterPassword) {
    throw new Error('Master password is required for encryption.');
  }

  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();

  // Fresh 16-byte salt if not provided
  let saltBytes;
  if (existingSalt) {
    saltBytes = typeof existingSalt === 'string' ? base64ToUint8Array(existingSalt) : existingSalt;
  } else {
    saltBytes = cryptoObj.getRandomValues(new Uint8Array(16));
  }

  // Derive AES-GCM key
  const key = await deriveKey(masterPassword, saltBytes, iterations);

  // Fresh 12-byte IV (96 bits) for every AES-GCM operation
  const ivBytes = cryptoObj.getRandomValues(new Uint8Array(12));

  // Serialize and encrypt
  const serialized = JSON.stringify(data);
  const plaintextBytes = encoder.encode(serialized);

  const ciphertextBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    plaintextBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: uint8ArrayToBase64(saltBytes),
    iv: uint8ArrayToBase64(ivBytes),
    ciphertext: uint8ArrayToBase64(ciphertextBytes),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt an encrypted package using AES-GCM and the master password
 * Throws an error if the master password is incorrect or data is corrupted.
 */
export async function decryptData(encryptedPackage, masterPassword) {
  if (!encryptedPackage || !encryptedPackage.ciphertext || !encryptedPackage.salt || !encryptedPackage.iv) {
    throw new Error('Invalid encrypted package structure.');
  }

  if (!masterPassword) {
    throw new Error('Master password is required for decryption.');
  }

  const cryptoObj = getCrypto();
  const decoder = new TextDecoder();

  const saltBytes = base64ToUint8Array(encryptedPackage.salt);
  const ivBytes = base64ToUint8Array(encryptedPackage.iv);
  const ciphertextBytes = base64ToUint8Array(encryptedPackage.ciphertext);
  const iterations = encryptedPackage.iterations || DEFAULT_ITERATIONS;

  let key;
  try {
    key = await deriveKey(masterPassword, saltBytes, iterations);
  } catch (err) {
    throw new Error('Key derivation failed: ' + err.message);
  }

  try {
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      key,
      ciphertextBytes
    );

    const decryptedText = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (err) {
    // AES-GCM authentication failure throws OperationError
    throw new Error('Incorrect master password or corrupted vault data.');
  }
}

/**
 * Package an encrypted vault into a backup payload
 */
export function createVaultBackup(encryptedPackage, metadata = {}) {
  return {
    vaultBackupFormat: 'password-vault-encrypted-backup',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    itemCount: metadata.itemCount ?? 0,
    encryptedPackage,
  };
}

/**
 * Validate backup JSON file structure
 */
export function validateBackupFile(content) {
  let parsed;
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content;
  } catch (e) {
    throw new Error('Invalid backup file: Not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file: Payload is not an object.');
  }

  if (parsed.vaultBackupFormat !== 'password-vault-encrypted-backup') {
    throw new Error('Invalid backup file: Unrecognized backup format.');
  }

  const pkg = parsed.encryptedPackage;
  if (!pkg || !pkg.ciphertext || !pkg.salt || !pkg.iv) {
    throw new Error('Invalid backup file: Missing encrypted payload components.');
  }

  return parsed;
}
