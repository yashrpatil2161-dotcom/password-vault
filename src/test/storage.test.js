import { describe, it, expect, beforeEach } from 'vitest';
import {
  isVaultInitialized,
  saveEncryptedVault,
  getEncryptedVault,
  saveSettings,
  getSettings,
  clearVault,
} from '../services/storage';

describe('IndexedDB Storage Service', () => {
  beforeEach(async () => {
    await clearVault();
  });

  it('reports vault is not initialized initially', async () => {
    const initialized = await isVaultInitialized();
    expect(initialized).toBe(false);
  });

  it('saves and retrieves encrypted vault payload', async () => {
    const samplePackage = {
      version: 1,
      salt: 'c2FsdA==',
      iv: 'aXZpdml2',
      ciphertext: 'ZW5jcnlwdGVkX2RhdGE=',
      updatedAt: new Date().toISOString(),
    };

    await saveEncryptedVault(samplePackage);

    const initialized = await isVaultInitialized();
    expect(initialized).toBe(true);

    const retrieved = await getEncryptedVault();
    expect(retrieved).toEqual(samplePackage);
  });

  it('saves and loads user settings', async () => {
    const initialSettings = await getSettings();
    expect(initialSettings).toHaveProperty('autoLockMinutes');

    const updatedSettings = {
      ...initialSettings,
      autoLockMinutes: 5,
      defaultLength: 24,
    };

    await saveSettings(updatedSettings);

    const reloadedSettings = await getSettings();
    expect(reloadedSettings.autoLockMinutes).toBe(5);
    expect(reloadedSettings.defaultLength).toBe(24);
  });

  it('clears vault and resets initialized state', async () => {
    await saveEncryptedVault({
      version: 1,
      salt: '123',
      iv: '456',
      ciphertext: '789',
    });

    expect(await isVaultInitialized()).toBe(true);

    await clearVault();

    expect(await isVaultInitialized()).toBe(false);
    expect(await getEncryptedVault()).toBeNull();
  });
});
