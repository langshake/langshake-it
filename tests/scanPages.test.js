import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { scanPages } from '../src/core/scanPages.js';

const FIXTURE_DIR = path.join(__dirname, 'fixtures/html');
const TEMP_DIR = path.join(__dirname, 'tmp-scanpages');

// Only .html files should be discovered

describe('scanPages (HTML only)', () => {
  beforeEach(async () => {
    await fs.remove(TEMP_DIR);
    await fs.ensureDir(TEMP_DIR);
    // Copy benchmark.html
    await fs.copy(path.join(FIXTURE_DIR, 'benchmark.html'), path.join(TEMP_DIR, 'benchmark.html'));
  });
  afterEach(async () => {
    await fs.remove(TEMP_DIR);
  });

  it('finds only .html files in the directory', async () => {
    const files = await scanPages(TEMP_DIR);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/benchmark\.html$/);
  });

  it('returns empty array if no .html files', async () => {
    await fs.remove(path.join(TEMP_DIR, 'benchmark.html'));
    const files = await scanPages(TEMP_DIR);
    expect(files).toEqual([]);
  });

  it('returns empty array if directory does not exist', async () => {
    await fs.remove(TEMP_DIR);
    const files = await scanPages(TEMP_DIR);
    expect(files).toEqual([]);
  });
});
