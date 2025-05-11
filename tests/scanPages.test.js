import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { scanPages } from '../src/core/scanPages.js';

const FIXTURE_DIR = path.join(__dirname, 'fixtures/nextjs/pages');
const NON_EXISTENT_DIR = path.join(__dirname, 'does-not-exist');
const TEMP_UNREADABLE_DIR = path.join(__dirname, 'temp-unreadable');

/**
 * Unit tests for scanPages.js
 */
describe('scanPages', () => {
  it('should return a list of supported files (expected use)', async () => {
    const files = await scanPages(FIXTURE_DIR);
    // Should find about.jsx and contact.mdx
    expect(files.some(f => f.endsWith('about.jsx'))).toBe(true);
    expect(files.some(f => f.endsWith('contact.mdx'))).toBe(true);
    expect(files.length).toBe(2);
  });

  it('should handle missing directories (edge case)', async () => {
    const files = await scanPages(NON_EXISTENT_DIR);
    expect(files).toEqual([]);
  });

  it('should handle empty directories (edge case)', async () => {
    const emptyDir = path.join(__dirname, 'empty');
    await fs.ensureDir(emptyDir);
    const files = await scanPages(emptyDir);
    expect(files).toEqual([]);
    await fs.remove(emptyDir);
  });

  it('should not throw on unreadable directory (failure case)', async () => {
    await fs.ensureDir(TEMP_UNREADABLE_DIR);
    await fs.chmod(TEMP_UNREADABLE_DIR, 0o000); // Remove all permissions
    let files;
    let error;
    try {
      files = await scanPages(TEMP_UNREADABLE_DIR);
    } catch (e) {
      error = e;
    }
    // Should not throw, should return []
    expect(error).toBeUndefined();
    expect(files).toEqual([]);
    await fs.chmod(TEMP_UNREADABLE_DIR, 0o755); // Restore permissions
    await fs.remove(TEMP_UNREADABLE_DIR);
  });
});
