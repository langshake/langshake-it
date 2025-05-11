import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { readCache, writeCache } from '../src/core/cache.js';

const TEMP_CACHE_PATH = path.join(__dirname, 'tmp-langshake-cache.json');

// Helper to corrupt the cache file
async function corruptCacheFile() {
  await fs.writeFile(TEMP_CACHE_PATH, 'not a json', 'utf-8');
}

describe('cache.js', () => {
  beforeEach(async () => {
    await fs.remove(TEMP_CACHE_PATH);
  });
  afterEach(async () => {
    await fs.remove(TEMP_CACHE_PATH);
  });

  it('creates and reads empty cache if file does not exist', async () => {
    const data = await readCache(TEMP_CACHE_PATH);
    expect(data).toEqual({});
    expect(await fs.pathExists(TEMP_CACHE_PATH)).toBe(true);
  });

  it('reads valid cache file', async () => {
    const obj = { foo: 'bar', count: 2 };
    await fs.writeJson(TEMP_CACHE_PATH, obj);
    const data = await readCache(TEMP_CACHE_PATH);
    expect(data).toEqual(obj);
  });

  it('resets and returns empty object if file is invalid', async () => {
    await corruptCacheFile();
    const data = await readCache(TEMP_CACHE_PATH);
    expect(data).toEqual({});
    // Should have reset the file
    const fileData = await fs.readJson(TEMP_CACHE_PATH);
    expect(fileData).toEqual({});
  });

  it('writes and then reads cache data', async () => {
    const obj = { a: 1, b: 'test' };
    await writeCache(TEMP_CACHE_PATH, obj);
    const data = await readCache(TEMP_CACHE_PATH);
    expect(data).toEqual(obj);
  });

  it('throws on unwritable location', async () => {
    let error;
    try {
      await writeCache('/root/invalid-cache.json', { foo: 1 });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatch(/Failed to write cache/);
  });
}); 