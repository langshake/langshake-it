import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { generateSchema } from '../src/core/generateSchema.js';
import { writeJsonLD } from '../src/core/writeJsonLD.js';

const FIXTURE_HTML_PATH = path.join(__dirname, 'fixtures/html/benchmark.html');
const TEMP_OUT_DIR = path.join(__dirname, 'tmp-langshake-integration');
const SLUG = 'benchmark';
const FILE_PATH = path.join(TEMP_OUT_DIR, `${SLUG}.json`);

let cache;

describe('Integration: generateSchema + writeJsonLD', () => {
  beforeEach(async () => {
    cache = {};
    await fs.remove(TEMP_OUT_DIR);
  });
  afterEach(async () => {
    await fs.remove(TEMP_OUT_DIR);
  });

  it('extracts JSON-LD from HTML fixture and writes it with checksum as last element', async () => {
    // Extract JSON-LD from the HTML fixture
    const schemas = await generateSchema(FIXTURE_HTML_PATH);
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.length).toBeGreaterThan(0);
    // Write the JSON-LD to output
    const result = await writeJsonLD(TEMP_OUT_DIR, SLUG, schemas, cache);
    expect(result.written).toBe(true);
    expect(await fs.pathExists(FILE_PATH)).toBe(true);
    const data = await fs.readJson(FILE_PATH);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(schemas.length + 1);
    // All but last should be data objects
    for (let i = 0; i < schemas.length; i++) {
      expect(typeof data[i]).toBe('object');
      expect(data[i]).not.toHaveProperty('checksum');
    }
    // Last element should be checksum object
    const last = data[data.length - 1];
    expect(typeof last.checksum).toBe('string');
    expect(last.checksum.length).toBe(64); // SHA-256 hex
  });
}); 