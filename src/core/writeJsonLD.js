import fs from 'fs-extra';
import path from 'path';
import { calculateModuleChecksum } from '../utils/merkle.js';

/**
 * Write JSON-LD to /public/langshake/[slug].json if content changed (by hash).
 *
 * @param {string} outDir - Output directory (e.g., public/langshake)
 * @param {string} slug - Slug for the JSON file (e.g., 'about')
 * @param {object|object[]} jsonLD - JSON-LD object or array to write
 * @param {object} cache - Cache object (mutable, will be updated)
 * @returns {Promise<{written: boolean, hash: string, file: string}>}
 */
export async function writeJsonLD(outDir, slug, jsonLD, cache) {
  try {
    await fs.ensureDir(outDir);
    const filePath = path.join(outDir, `${slug}.json`);
    const hash = calculateModuleChecksum(jsonLD);
    // Compare with cache
    if (cache[slug] && cache[slug] === hash && await fs.pathExists(filePath)) {
      return { written: false, hash, file: filePath };
    }
    // Add checksum to output
    const output = Array.isArray(jsonLD)
      ? jsonLD.map(obj => ({ ...obj, checksum: hash }))
      : { ...jsonLD, checksum: hash };
    await fs.writeJson(filePath, output, { spaces: 2 });
    cache[slug] = hash;
    return { written: true, hash, file: filePath };
  } catch (err) {
    throw new Error(`Failed to write JSON-LD for slug '${slug}': ${err.message}`);
  }
}
