import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  evaluatePasswordStrength,
  encryptData,
  decryptData,
  createVaultBackup,
  validateBackupFile,
  CHAR_SETS,
} from '../services/crypto';

describe('Password Generator Service', () => {
  it('generates a password of the requested length', () => {
    const pw16 = generatePassword({ length: 16 });
    expect(pw16).toHaveLength(16);

    const pw32 = generatePassword({ length: 32 });
    expect(pw32).toHaveLength(32);
  });

  it('respects character set options', () => {
    // Numbers only
    const numOnly = generatePassword({
      length: 20,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
    });
    expect(/^[0-9]+$/.test(numOnly)).toBe(true);

    // Uppercase only
    const upperOnly = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: false,
      numbers: false,
      symbols: false,
    });
    expect(/^[A-Z]+$/.test(upperOnly)).toBe(true);

    // Symbols only
    const symbolOnly = generatePassword({
      length: 20,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: true,
    });
    for (const char of symbolOnly) {
      expect(CHAR_SETS.symbols.includes(char)).toBe(true);
    }
  });

  it('guarantees at least one character from each enabled set', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({
        length: 12,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      });

      expect(/[A-Z]/.test(pw)).toBe(true);
      expect(/[a-z]/.test(pw)).toBe(true);
      expect(/[0-9]/.test(pw)).toBe(true);
      expect(/[^a-zA-Z0-9]/.test(pw)).toBe(true);
    }
  });

  it('evaluates password strength accurately', () => {
    const weak = evaluatePasswordStrength('12345');
    expect(weak.score).toBeLessThanOrEqual(1);

    const moderate = evaluatePasswordStrength('MyPass12');
    expect(moderate.score).toBeGreaterThanOrEqual(2);

    const strong = evaluatePasswordStrength('Tr0ub4dor&34#Secure');
    expect(strong.score).toBeGreaterThanOrEqual(3);
  });
});

describe('Web Crypto AES-GCM & PBKDF2 Service', () => {
  const masterPassword = 'CorrectHorseBatteryStaple1!';
  const sampleData = {
    credentials: [
      { id: '1', name: 'GitHub', username: 'alice', password: 'supersecretpassword123' },
      { id: '2', name: 'ProtonMail', username: 'alice@proton.me', password: 'anothersecretpassword456' },
    ],
  };

  it('encrypts data and decrypts it back correctly', async () => {
    const encrypted = await encryptData(sampleData, masterPassword);

    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('salt');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted.ciphertext).not.toBe(JSON.stringify(sampleData));

    const decrypted = await decryptData(encrypted, masterPassword);
    expect(decrypted).toEqual(sampleData);
  });

  it('uses a fresh IV and generates distinct ciphertexts for identical plaintext', async () => {
    const enc1 = await encryptData(sampleData, masterPassword);
    const enc2 = await encryptData(sampleData, masterPassword);

    expect(enc1.iv).not.toEqual(enc2.iv);
    expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
  });

  it('throws an error when decrypting with an incorrect master password', async () => {
    const encrypted = await encryptData(sampleData, masterPassword);

    await expect(decryptData(encrypted, 'WrongPassword123!')).rejects.toThrow(
      /Incorrect master password or corrupted vault data/
    );
  });

  it('throws an error when decrypting corrupted ciphertext', async () => {
    const encrypted = await encryptData(sampleData, masterPassword);
    // Tamper with ciphertext
    const corruptedPkg = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.substring(0, 10) + 'AAAA' + encrypted.ciphertext.substring(14),
    };

    await expect(decryptData(corruptedPkg, masterPassword)).rejects.toThrow();
  });
});

describe('Backup and Restore Validation', () => {
  it('creates and validates a legitimate backup package', async () => {
    const encrypted = await encryptData({ test: 123 }, 'pass123');
    const backup = createVaultBackup(encrypted, { itemCount: 1 });

    const backupJson = JSON.stringify(backup);
    const validated = validateBackupFile(backupJson);

    expect(validated.vaultBackupFormat).toBe('password-vault-encrypted-backup');
    expect(validated.encryptedPackage.ciphertext).toBe(encrypted.ciphertext);
  });

  it('rejects invalid JSON or malformed backup payloads', () => {
    expect(() => validateBackupFile('not json content')).toThrow(/Not valid JSON/);
    expect(() => validateBackupFile(JSON.stringify({ someOtherField: 1 }))).toThrow(/Unrecognized backup format/);
    expect(() =>
      validateBackupFile(
        JSON.stringify({
          vaultBackupFormat: 'password-vault-encrypted-backup',
          encryptedPackage: { salt: 'abc' }, // missing iv and ciphertext
        })
      )
    ).toThrow(/Missing encrypted payload components/);
  });
});
