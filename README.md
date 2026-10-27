# Password Vault 🔐

A modern, responsive, zero-knowledge personal password generator and encrypted credentials vault built with React, Vite, CSS, and the Web Crypto API.

All sensitive data is encrypted directly inside your browser before being persisted to IndexedDB. No backend servers, cloud databases, external tracking, or third-party APIs are used—your data stays 100% private to your browser.

---

## 🌟 Key Features

### 1. Cryptographically Secure Password Generator
- **True Randomness:** Utilizes `crypto.getRandomValues()` with rejection sampling to eliminate modulo bias—never uses `Math.random()`.
- **Customizable Length:** Generate passwords ranging from 8 to 64 characters (default: 16).
- **Character Pool Options:** Toggle uppercase letters (`A-Z`), lowercase letters (`a-z`), numbers (`0-9`), and special symbols (`!@#$%^&*...`).
- **Guaranteed Complexity:** Guarantees at least one character from every enabled character set.
- **Strength Evaluation:** Real-time entropy calculation (bits), security rating (Weak, Moderate, Strong, Very Strong), and feedback.
- **Copy & Save:** One-click copy with visual confirmation (`Copied!` tooltip & checkmark) and instant "Save to Vault" action.

### 2. My Password Vault
- **Encrypted Credential Storage:** Store website/app name, URL, username/email, password, and optional notes.
- **Zero-Knowledge Privacy:** Passwords masked by default (`••••••••••••`). Individual show/hide toggles.
- **Search & Filter:** Instant search across website names, usernames, and URLs.
- **Credential Management:** Add, edit, and delete credentials with an accessible confirmation dialog to prevent accidental deletion.
- **Convenient Actions:** Fast copy buttons for both passwords and usernames with visual feedback.
- **Direct Launch:** Quick link to open website URLs in a new tab.

### 3. Dashboard
- **Total Saved Passwords:** Quick counter and metrics.
- **Quick Generator Widget:** 16-character secure password generated on demand.
- **Recently Added Entries:** Review recently added or updated credentials (website name and username). **Actual passwords are never shown on the dashboard.**
- **Shortcut Actions:** Jump directly to your vault or trigger a manual lock.

### 4. Robust Security & Auto-Lock
- **First-Time Master Setup:** Guides users to create an 8+ character master password.
- **Zero-Knowledge Decryption:** Authenticated AES-GCM decryption serves as the verification step. The master password and derived encryption keys are never stored on disk.
- **Idle Inactivity Auto-Lock:** Monitors user activity (mouse, keyboard, touch, scroll) and automatically locks the vault after a configurable timeout (1m, 5m, 15m, 30m, 1h, or disabled).
- **Instant Manual Lock:** One-click lock button in the desktop sidebar, mobile header, and dashboard.
- **Zero Recovery Notice:** Clear disclosures that forgotten master passwords cannot be recovered without a valid backup file.

### 5. Encrypted Backup & Restore
- **Export Backup:** Download a clean `.json` file containing the AES-GCM ciphertext, PBKDF2 salt, and IV.
- **Import & Validate:** Import a backup file by verifying its cryptographic structure and decrypting with the backup's master password.
- **Non-Destructive Failures:** If decryption or validation of an imported backup fails, the existing active vault remains untouched.

---

## 🛡️ Cryptographic Architecture

```
User Master Password
        │
        ▼
PBKDF2 Key Derivation
  - HMAC: SHA-256
  - Iterations: 250,000 rounds
  - Salt: 128-bit cryptographically secure random bytes
        │
        ▼
Derived Key: AES-GCM 256-bit
        │
        ▼
Authenticated Encryption (AES-GCM)
  - Initialization Vector (IV): Fresh 96-bit random bytes per write
  - Plaintext: Serialized JSON credential array
        │
        ▼
IndexedDB Local Persistence ('PasswordVaultDB')
  - Stores only Base64 ciphertext, IV, and salt.
  - Plaintext credentials and master keys exist exclusively in active RAM.
```

### Security Limitations & Threat Model
1. **Host Device Security:** Because encryption and decryption occur locally in JavaScript, an infected device with keyloggers or malware targeting browser memory could intercept plaintext.
2. **Malicious Browser Extensions:** Browser extensions with broad permissions can read DOM contents. Always run sensitive applications in a clean browser profile.
3. **Forgotten Master Password:** By design, there is no backdoor, server reset, or SMS recovery. If you lose your master password and have no backup, data cannot be decrypted.
4. **Browser Data Clearing:** If you manually clear your browser's IndexedDB / site storage, your vault data will be erased. Regular encrypted backups are strongly recommended.

---

## 📁 Project Structure

```
Pass-save/
├── index.html                   # HTML5 template with modern fonts
├── package.json                 # Project dependencies & scripts
├── vite.config.js               # Vite & Vitest configuration
├── src/
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Main view switcher and state wrapper
│   ├── index.css                # Modern dark theme & responsive styles
│   ├── context/
│   │   └── VaultContext.jsx     # State manager, crypto bridge & auto-lock
│   ├── services/
│   │   ├── crypto.js            # Web Crypto API & password generator
│   │   └── storage.js           # IndexedDB storage provider
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx      # Desktop sidebar navigation
│   │   │   ├── Navbar.jsx       # Mobile header & menu toggle
│   │   │   └── Toast.jsx        # Notification toast manager
│   │   ├── auth/
│   │   │   ├── SetupVault.jsx   # First-time master password setup
│   │   │   └── UnlockVault.jsx  # Unlock screen & recovery help
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx    # Metrics, quick generator & recent list
│   │   ├── generator/
│   │   │   └── PasswordGenerator.jsx # Full-featured generator page
│   │   ├── vault/
│   │   │   ├── VaultList.jsx    # Credentials list, search, reveal & actions
│   │   │   ├── CredentialModal.jsx # Add & Edit modal
│   │   │   └── DeleteConfirmModal.jsx # Accessible delete confirmation
│   │   └── settings/
│   │       └── Settings.jsx     # Auto-lock, backups, password change & wipe
│   └── test/
│       ├── setup.js             # Vitest jsdom & fake-indexeddb setup
│       ├── crypto.test.js       # Crypto & password generator tests
│       ├── storage.test.js      # IndexedDB persistence tests
│       └── vault.test.jsx       # Integration & component tests
└── dist/                        # Production build output
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation
```bash
# Clone or navigate to the project directory
cd Pass-save

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Building for Production
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 Running Automated Tests

The project includes unit and integration tests powered by **Vitest** and **React Testing Library**:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Highlights
- ✅ Password generation, length limits, and character set options.
- ✅ Password copying to clipboard.
- ✅ Credential creation, searching, editing, and deletion with confirmation.
- ✅ AES-GCM-256 encryption & decryption integrity.
- ✅ Correct and incorrect master password validation.
- ✅ Persistence across page reloads using IndexedDB.
- ✅ Instant manual locking and session memory wipes.
- ✅ Encrypted backup creation and restore.
- ✅ Rejection of corrupted backup files without altering active vault.

---

## 📜 License
MIT License. Free for personal and commercial use.
