import fs from 'fs-extra';
import path from 'path';
import { calculateMerkleRoot } from '../utils/merkle.js';

const DEFAULT_LLM_CONTEXT_PATH = path.resolve(process.cwd(), 'llm_context.json');

/**
 * Loads llm_context.json from the project root (if present and valid).
 * @param {string} [contextPath] - Path to llm_context.json
 * @returns {Promise<object|null>} Parsed context or null if not found/invalid
 */
export async function loadLLMContext(contextPath = DEFAULT_LLM_CONTEXT_PATH) {
  try {
    if (await fs.pathExists(contextPath)) {
      const ctx = await fs.readJson(contextPath);
      if (typeof ctx === 'object' && ctx !== null) return ctx;
    }
  } catch {}
  return null;
}

/**
 * Builds the .well-known/llm.json index with Merkle root and site metadata.
 *
 * @param {string} llmPath - Path to llm.json (e.g., public/.well-known/llm.json)
 * @param {Array<{ path: string, hash: string }>} modules - List of modules with their output paths and hashes
 * @param {object} site - Site metadata (name, description, language)
 * @param {object|null} [llmContext] - Optional LLM context (summary, principles, usage_notes)
 * @returns {Promise<void>}
 */
export async function buildLLMIndex(llmPath, modules, site, llmContext) {
  try {
    // Prepare modules array for llm.json (just the paths)
    const modulePaths = modules.map(m => m.path);
    const hashes = modules.map(m => m.hash);
    const merkleRoot = calculateMerkleRoot(hashes);
    const now = new Date().toISOString().split('T')[0];
    const llmJson = {
      version: '1.0',
      site,
      modules: modulePaths,
      ...(llmContext ? { llm_context: llmContext } : {}),
      verification: {
        strategy: 'merkle',
        merkleRoot,
        lastVerified: now,
      },
    };
    await fs.ensureDir(path.dirname(llmPath));
    await fs.writeJson(llmPath, llmJson, { spaces: 2 });
  } catch (err) {
    throw new Error(`Failed to build LLM index: ${err.message}`);
  }
}
