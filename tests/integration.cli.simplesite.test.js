import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execa } from 'execa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, 'fixtures/simple-site');

function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'langshake-simplesite-'));
}

describe('Langshake CLI integration (Next.js simple-site)', () => {
  let tempDir;
  let outDir;
  let llmPath;

  beforeEach(async () => {
    tempDir = await makeTempDir();
    await fs.copy(FIXTURE_DIR, tempDir);
    outDir = path.join(tempDir, 'public/langshake');
    llmPath = path.join(tempDir, 'public/.well-known/llm.json');
    await fs.ensureDir(path.dirname(llmPath));
    // Install dependencies
    await execa('npm', ['install'], { cwd: tempDir });
  }, 120_000); // Allow extra time for npm install

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('builds, exports, and runs the CLI to generate expected JSON-LD and llm.json', async () => {
    const cliPath = path.join(__dirname, '../src/cli/index.js');
    const inputDir = path.join(tempDir, 'out');
    const args = [
      cliPath,
      '--build', 'npm run build',
      '--input', inputDir,
      '--out', outDir,
      '--llm', llmPath,
      '--force',
      '--verbose'
    ];
    let result;
    try {
      result = await execa('node', args, { cwd: tempDir });
    } catch (err) {
      console.error('CLI STDOUT:', err.stdout);
      console.error('CLI STDERR:', err.stderr);
      throw err;
    }
    // Log output for debugging
    console.log('CLI STDOUT:', result.stdout);
    console.log('CLI STDERR:', result.stderr);
    expect(result.exitCode).toBe(0);
    // Check output files
    const aboutJson = path.join(outDir, 'about.json');
    const contactJson = path.join(outDir, 'contact.json');
    expect(await fs.pathExists(aboutJson)).toBe(true);
    expect(await fs.pathExists(contactJson)).toBe(true);
    expect(await fs.pathExists(llmPath)).toBe(true);
    // Validate about.json content
    const aboutData = await fs.readJson(aboutJson);
    expect(Array.isArray(aboutData)).toBe(true);
    expect(aboutData[0]['@type']).toBe('AboutPage');
    // Validate contact.json content
    const contactData = await fs.readJson(contactJson);
    expect(Array.isArray(contactData)).toBe(true);
    expect(contactData[0]['@type']).toBe('ContactPage');
  }, 180_000); // Allow extra time for build/export/cli
}); 