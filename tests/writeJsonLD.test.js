import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { writeJsonLD } from '../src/core/writeJsonLD.js';

const TEMP_OUT_DIR = path.join(__dirname, 'tmp-langshake-out');
const SLUG = 'testpage';
const FILE_PATH = path.join(TEMP_OUT_DIR, `${SLUG}.json`);

const simpleJsonLD = {
  '@context': 'http://schema.org',
  '@type': 'Article',
  headline: 'Test Article',
};
const changedJsonLD = {
  ...simpleJsonLD,
  headline: 'Changed Headline',
};
const arrayJsonLD = [
  simpleJsonLD,
  { '@context': 'http://schema.org', '@type': 'Product', name: 'Widget' },
];

let cache;

describe('writeJsonLD', () => {
  beforeEach(async () => {
    cache = {};
    await fs.remove(TEMP_OUT_DIR);
  });
  afterEach(async () => {
    await fs.remove(TEMP_OUT_DIR);
  });

  it('writes file if not in cache', async () => {
    const result = await writeJsonLD(TEMP_OUT_DIR, SLUG, simpleJsonLD, cache);
    expect(result.written).toBe(true);
    expect(await fs.pathExists(FILE_PATH)).toBe(true);
    const data = await fs.readJson(FILE_PATH);
    expect(data.headline).toBe('Test Article');
    expect(typeof data.checksum).toBe('string');
    expect(cache[SLUG]).toBe(result.hash);
  });

  it('skips write if hash unchanged', async () => {
    await writeJsonLD(TEMP_OUT_DIR, SLUG, simpleJsonLD, cache);
    const result2 = await writeJsonLD(TEMP_OUT_DIR, SLUG, simpleJsonLD, cache);
    expect(result2.written).toBe(false);
    expect(await fs.pathExists(FILE_PATH)).toBe(true);
  });

  it('updates file if content changes', async () => {
    await writeJsonLD(TEMP_OUT_DIR, SLUG, simpleJsonLD, cache);
    const result2 = await writeJsonLD(TEMP_OUT_DIR, SLUG, changedJsonLD, cache);
    expect(result2.written).toBe(true);
    const data = await fs.readJson(FILE_PATH);
    expect(data.headline).toBe('Changed Headline');
    expect(typeof data.checksum).toBe('string');
    expect(cache[SLUG]).toBe(result2.hash);
  });

  it('handles arrays and adds checksum to each object', async () => {
    const result = await writeJsonLD(TEMP_OUT_DIR, SLUG, arrayJsonLD, cache);
    expect(result.written).toBe(true);
    const data = await fs.readJson(FILE_PATH);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].headline).toBe('Test Article');
    expect(typeof data[0].checksum).toBe('string');
    expect(typeof data[1].checksum).toBe('string');
  });

  it('throws on invalid output directory', async () => {
    let error;
    try {
      await writeJsonLD('/root/invalid-dir', SLUG, simpleJsonLD, cache);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatch(/Failed to write/);
  });
}); 