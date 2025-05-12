import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { buildLLMIndex } from '../src/core/buildLLMIndex.js';
import { prepareMerkleIndex } from '../src/utils/merkle.js';

const TEMP_OUT_DIR = path.join(__dirname, 'tmp-llm-index');
const LLM_PATH = path.join(TEMP_OUT_DIR, '.well-known/llm.json');

const modules = [
  { path: 'langshake/about.json', hash: 'a'.repeat(64) },
  { path: 'langshake/contact.json', hash: 'b'.repeat(64) },
];
const site = {
  name: 'Test Site',
  description: 'A test site for Langshake.',
  language: 'en',
};
const llmContext = {
  summary: 'Test summary',
  principles: ['Test principle'],
  usage_notes: ['Test usage note'],
};

describe('buildLLMIndex', () => {
  beforeEach(async () => {
    await fs.remove(TEMP_OUT_DIR);
  });
  afterEach(async () => {
    await fs.remove(TEMP_OUT_DIR);
  });

  it('writes a valid llm.json with correct structure and Merkle root', async () => {
    await buildLLMIndex(LLM_PATH, modules, site, llmContext);
    expect(await fs.pathExists(LLM_PATH)).toBe(true);
    const data = await fs.readJson(LLM_PATH);
    const { modulePaths, merkleRoot } = prepareMerkleIndex(modules);
    expect(data.version).toBe('1.0');
    expect(data.site).toEqual(site);
    expect(data.modules).toEqual(modulePaths);
    expect(data.llm_context).toEqual(llmContext);
    expect(data.verification.strategy).toBe('merkle');
    expect(data.verification.merkleRoot).toBe(merkleRoot);
    expect(typeof data.verification.lastVerified).toBe('string');
  });

  it('omits llm_context if not provided', async () => {
    await buildLLMIndex(LLM_PATH, modules, site);
    const data = await fs.readJson(LLM_PATH);
    expect(data.llm_context).toBeUndefined();
  });

  it('throws an error if output path is invalid', async () => {
    let error;
    try {
      await buildLLMIndex('/root/invalid-llm.json', modules, site, llmContext);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatch(/Failed to build LLM index/);
  });

  it('handles empty modules array and produces empty modules/merkleRoot', async () => {
    await buildLLMIndex(LLM_PATH, [], site, llmContext);
    const data = await fs.readJson(LLM_PATH);
    expect(Array.isArray(data.modules)).toBe(true);
    expect(data.modules.length).toBe(0);
    expect(data.verification.merkleRoot).toBe('');
  });

  it('produces the same Merkle root regardless of module order', async () => {
    const modulesA = [
      { path: 'langshake/about.json', hash: 'a'.repeat(64) },
      { path: 'langshake/contact.json', hash: 'b'.repeat(64) },
      { path: 'langshake/other.json', hash: 'c'.repeat(64) },
    ];
    const modulesB = [...modulesA].reverse();
    const llmPathA = path.join(TEMP_OUT_DIR, '.well-known/llmA.json');
    const llmPathB = path.join(TEMP_OUT_DIR, '.well-known/llmB.json');
    await buildLLMIndex(llmPathA, modulesA, site, llmContext);
    await buildLLMIndex(llmPathB, modulesB, site, llmContext);
    const dataA = await fs.readJson(llmPathA);
    const dataB = await fs.readJson(llmPathB);
    const { merkleRoot: rootA } = prepareMerkleIndex(modulesA);
    const { merkleRoot: rootB } = prepareMerkleIndex(modulesB);
    expect(dataA.verification.merkleRoot).toBe(dataB.verification.merkleRoot);
    expect(dataA.verification.merkleRoot).toBe(rootA);
    expect(dataB.verification.merkleRoot).toBe(rootB);
  });
}); 