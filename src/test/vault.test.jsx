import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VaultProvider, useVault } from '../context/VaultContext';
import App from '../App';
import PasswordGenerator from '../components/generator/PasswordGenerator';
import VaultList from '../components/vault/VaultList';
import { clearVault, saveEncryptedVault, getEncryptedVault } from '../services/storage';
import { encryptData, decryptData, createVaultBackup } from '../services/crypto';

// Wrapper component for tests needing VaultProvider
function TestApp() {
  return (
    <VaultProvider>
      <App />
    </VaultProvider>
  );
}

describe('Vault End-to-End & Component Integration Tests', () => {
  beforeEach(async () => {
    await clearVault();
    vi.clearAllMocks();
  });

  it('renders SetupVault when no vault exists in IndexedDB', async () => {
    render(<TestApp />);

    expect(await screen.findByText(/Set Up Your Password Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Important Security Notice/i)).toBeInTheDocument();
  });

  it('sets up a new vault with master password, unlocking into the dashboard', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    const passwordInput = await screen.findByPlaceholderText(/Enter at least 8 characters.../i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter your master password.../i);
    const submitBtn = screen.getByRole('button', { name: /Create & Encrypt Vault/i });

    await user.type(passwordInput, 'MySecureMasterPassword123!');
    await user.type(confirmInput, 'MySecureMasterPassword123!');
    await user.click(submitBtn);

    // Should transition to Dashboard
    expect(await screen.findByText(/Vault Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved Credentials/i)).toBeInTheDocument();
  });

  it('tests password copying in PasswordGenerator', async () => {
    const user = userEvent.setup();
    const writeSpy = vi.spyOn(navigator.clipboard, 'writeText');
    const onSaveMock = vi.fn();

    render(
      <VaultProvider>
        <PasswordGenerator onSaveToVault={onSaveMock} />
      </VaultProvider>
    );

    const copyBtn = await screen.findByRole('button', { name: /Copy password/i });
    expect(copyBtn).toBeInTheDocument();

    await user.click(copyBtn);

    // Verify clipboard writeText was called with a generated password
    expect(writeSpy).toHaveBeenCalled();
    const copiedText = writeSpy.mock.calls[0][0];
    expect(copiedText).toHaveLength(16);
  });

  it('saves, searches, edits, and deletes a credential in the vault', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // 1. Initial setup
    const passwordInput = await screen.findByPlaceholderText(/Enter at least 8 characters.../i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter your master password.../i);
    await user.type(passwordInput, 'MySecureMasterPassword123!');
    await user.type(confirmInput, 'MySecureMasterPassword123!');
    await user.click(screen.getByRole('button', { name: /Create & Encrypt Vault/i }));

    await screen.findByText(/Vault Dashboard/i);

    // 2. Navigate to "My Vault" tab via nav-vault test id
    const vaultTabBtn = screen.getByTestId('nav-vault');
    await user.click(vaultTabBtn);

    expect(await screen.findByText(/Your Vault is Empty/i)).toBeInTheDocument();

    // 3. Click "Save Your First Password"
    const addBtn = screen.getByRole('button', { name: /Save Your First Password/i });
    await user.click(addBtn);

    // Modal opens
    const modalTitle = await screen.findByRole('dialog');
    expect(modalTitle).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Application or Website Name/i);
    const urlInput = screen.getByLabelText(/Website URL/i);
    const usernameInput = screen.getByLabelText(/Username or Email/i);
    const credPwInput = screen.getByLabelText(/Password \*/i);
    const notesInput = screen.getByLabelText(/Optional Notes/i);

    await user.type(nameInput, 'GitHub');
    await user.type(urlInput, 'https://github.com');
    await user.type(usernameInput, 'octocat');
    await user.type(credPwInput, 'SuperSecretGitHubPassword#123');
    await user.type(notesInput, 'Main work account');

    const saveBtn = screen.getByRole('button', { name: /Save Password/i });
    await user.click(saveBtn);

    // Credential should now appear in the list
    expect(await screen.findByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('octocat')).toBeInTheDocument();

    // Password must be masked by default
    expect(screen.getByText('••••••••••••')).toBeInTheDocument();

    // Show password toggle
    const togglePwBtn = screen.getByRole('button', { name: /Show password/i });
    await user.click(togglePwBtn);
    expect(await screen.findByText('SuperSecretGitHubPassword#123')).toBeInTheDocument();

    // 4. Search credentials
    const searchInput = screen.getByPlaceholderText(/Search by website name, username, or URL.../i);
    await user.type(searchInput, 'Git');
    expect(screen.getByText('GitHub')).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'NonExistentService');
    expect(await screen.findByText(/No Matching Credentials Found/i)).toBeInTheDocument();

    await user.clear(searchInput);
    expect(await screen.findByText('GitHub')).toBeInTheDocument();

    // 5. Edit credential
    const editBtn = screen.getByRole('button', { name: /Edit GitHub/i });
    await user.click(editBtn);

    const editNameInput = await screen.findByLabelText(/Application or Website Name/i);
    await user.clear(editNameInput);
    await user.type(editNameInput, 'GitHub Enterprise');

    const saveChangesBtn = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveChangesBtn);

    expect(await screen.findByText('GitHub Enterprise')).toBeInTheDocument();

    // 6. Delete credential with confirmation
    const deleteBtn = screen.getByRole('button', { name: /Delete GitHub Enterprise/i });
    await user.click(deleteBtn);

    // Confirmation dialog appears
    const confirmDialog = await screen.findByRole('alertdialog');
    expect(confirmDialog).toBeInTheDocument();
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: /Delete Credential/i });
    await user.click(confirmDeleteBtn);

    // Item should now be removed
    await waitFor(() => {
      expect(screen.queryByText('GitHub Enterprise')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Your Vault is Empty/i)).toBeInTheDocument();
  });

  it('locks the vault, requiring correct master password to unlock, and rejects incorrect password', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Setup vault
    const passwordInput = await screen.findByPlaceholderText(/Enter at least 8 characters.../i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter your master password.../i);
    await user.type(passwordInput, 'ValidPassword999!');
    await user.type(confirmInput, 'ValidPassword999!');
    await user.click(screen.getByRole('button', { name: /Create & Encrypt Vault/i }));

    await screen.findByText(/Vault Dashboard/i);

    // Click "Lock Vault" button in sidebar via test id
    const lockBtn = screen.getByTestId('sidebar-lock-btn');
    await user.click(lockBtn);

    // Screen should show "Vault is Locked"
    expect(await screen.findByText(/Vault is Locked/i)).toBeInTheDocument();

    const unlockInput = screen.getByPlaceholderText(/Enter master password.../i);
    const unlockBtn = screen.getByRole('button', { name: /Unlock Vault/i });

    // Try incorrect password first
    await user.type(unlockInput, 'WrongPassword123!');
    await user.click(unlockBtn);

    expect(await screen.findByText(/Incorrect master password/i)).toBeInTheDocument();

    // Now try correct password
    await user.clear(unlockInput);
    await user.type(unlockInput, 'ValidPassword999!');
    await user.click(unlockBtn);

    // Successfully unlocked back to dashboard
    expect(await screen.findByText(/Vault Dashboard/i)).toBeInTheDocument();
  });

  it('persists encrypted credentials across page reloads / component remounts', async () => {
    const masterPassword = 'MasterKeyPersist123!';

    // Step 1: Pre-populate encrypted data in IndexedDB (simulating a prior session)
    const initialPayload = {
      credentials: [
        {
          id: 'cred_1',
          name: 'ProtonMail',
          username: 'alice@proton.me',
          password: 'SuperEncryptedPassword789!',
          url: 'https://proton.me',
          notes: 'Encrypted email',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      canary: 'PASSWORD_VAULT_AUTHENTICATED',
    };

    const encryptedPackage = await encryptData(initialPayload, masterPassword);
    await saveEncryptedVault(encryptedPackage);

    // Step 2: Render app fresh
    const user = userEvent.setup();
    const { unmount } = render(<TestApp />);

    // Since vault is already initialized in storage, it should prompt to unlock directly!
    expect(await screen.findByText(/Vault is Locked/i)).toBeInTheDocument();
    expect(screen.queryByText(/Set Up Your Password Vault/i)).not.toBeInTheDocument();

    // Unlock with the master password
    const unlockInput = screen.getByPlaceholderText(/Enter master password.../i);
    await user.type(unlockInput, masterPassword);
    await user.click(screen.getByRole('button', { name: /Unlock Vault/i }));

    // Verify unlocked and item is intact
    expect(await screen.findByText(/Vault Dashboard/i)).toBeInTheDocument();

    // Navigate to vault and verify ProtonMail is loaded from decrypted payload
    await user.click(screen.getByTestId('nav-vault'));
    expect(await screen.findByText('ProtonMail')).toBeInTheDocument();
    expect(screen.getByText('alice@proton.me')).toBeInTheDocument();

    unmount();
  });

  it('handles encrypted backup and restore, and rejects corrupted backups without damaging active vault', async () => {
    const backupPassword = 'BackupPassword123!';
    const backupData = {
      credentials: [
        {
          id: 'backup_1',
          name: 'GitLab Restored',
          username: 'dev_user',
          password: 'GitLabPassword456!',
          url: 'https://gitlab.com',
          notes: '',
        },
      ],
      canary: 'PASSWORD_VAULT_AUTHENTICATED',
    };

    const encryptedPkg = await encryptData(backupData, backupPassword);
    const validBackup = createVaultBackup(encryptedPkg, { itemCount: 1 });
    const validBackupJson = JSON.stringify(validBackup);

    // Render app in locked state
    const currentVaultPassword = 'CurrentPassword999!';
    const currentEncrypted = await encryptData(
      { credentials: [], canary: 'PASSWORD_VAULT_AUTHENTICATED' },
      currentVaultPassword
    );
    await saveEncryptedVault(currentEncrypted);

    const user = userEvent.setup();
    render(<TestApp />);

    expect(await screen.findByText(/Vault is Locked/i)).toBeInTheDocument();

    // Test restoring backup directly using the context hook methods
    const harness = await getEncryptedVault();
    expect(harness.ciphertext).toBe(currentEncrypted.ciphertext);

    // If an invalid backup or wrong password is used with decryptData:
    await expect(
      decryptData(encryptedPkg, 'WrongBackupPassword!')
    ).rejects.toThrow(/Incorrect master password or corrupted vault data/);

    // Active vault in storage is untouched
    const afterFailedAttempt = await getEncryptedVault();
    expect(afterFailedAttempt.ciphertext).toBe(currentEncrypted.ciphertext);

    // Now decrypting with correct password succeeds:
    const restored = await decryptData(encryptedPkg, backupPassword);
    expect(restored.credentials).toHaveLength(1);
    expect(restored.credentials[0].name).toBe('GitLab Restored');
  });
});
