import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock clipboard
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      readText: vi.fn().mockImplementation(() => Promise.resolve('')),
    },
    configurable: true,
  });
} else {
  navigator.clipboard.writeText = vi.fn().mockImplementation(() => Promise.resolve());
  navigator.clipboard.readText = vi.fn().mockImplementation(() => Promise.resolve(''));
}

// Window alerts and confirms
window.confirm = vi.fn(() => true);
window.alert = vi.fn();

// Clean up between tests
afterEach(() => {
  vi.clearAllMocks();
});
