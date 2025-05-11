import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { generateSchema } from '../src/core/generateSchema.js';

const FIXTURE_HTML_PATH = path.join(__dirname, 'fixtures/html/benchmark.html');

describe('generateSchema', () => {
  it('extracts all JSON-LD blocks as an array, in order', async () => {
    // Ensure the fixture exists
    expect(await fs.pathExists(FIXTURE_HTML_PATH)).toBe(true);
    const schemas = await generateSchema(FIXTURE_HTML_PATH);
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.length).toBe(3);
    expect(schemas[0]["@type"]).toBe("Article");
    expect(schemas[1]["@type"]).toBe("Product");
    expect(schemas[2]["@type"]).toBe("website");
    // Should not include the application/json block
    expect(schemas.some(s => s.foo === 'bar')).toBe(false);
  });

  it('returns an empty array if no JSON-LD is present', async () => {
    const noSchemaHtml = '<html><head></head><body><h1>No schema here</h1></body></html>';
    const noSchemaPath = path.join(__dirname, 'fixtures/html/temp-no-schema.html');
    await fs.writeFile(noSchemaPath, noSchemaHtml, 'utf-8');
    const schemas = await generateSchema(noSchemaPath);
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.length).toBe(0);
    await fs.remove(noSchemaPath);
  });
}); 