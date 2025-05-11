import fs from 'fs-extra';

const CACHE_PATH = '.langshake-cache.json';

/**
 * Reads the cache file (.langshake-cache.json). Creates it if missing.
 * @param {string} [cachePath] - Path to cache file (default: .langshake-cache.json)
 * @returns {Promise<object>} Cache data (empty object if missing/invalid)
 */
export async function readCache(cachePath = CACHE_PATH) {
  try {
    if (!(await fs.pathExists(cachePath))) {
      await fs.writeJson(cachePath, {}, { spaces: 2 });
      return {};
    }
    const data = await fs.readJson(cachePath);
    if (typeof data === 'object' && data !== null) return data;
    // If file is not an object, reset
    await fs.writeJson(cachePath, {}, { spaces: 2 });
    return {};
  } catch (err) {
    // On error, reset cache file
    await fs.writeJson(cachePath, {}, { spaces: 2 });
    return {};
  }
}

/**
 * Writes to the cache file (.langshake-cache.json).
 * @param {string} [cachePath] - Path to cache file (default: .langshake-cache.json)
 * @param {object} data - Cache data to write
 * @returns {Promise<void>}
 */
export async function writeCache(cachePath = CACHE_PATH, data) {
  try {
    await fs.writeJson(cachePath, data, { spaces: 2 });
  } catch (err) {
    throw new Error(`Failed to write cache: ${err.message}`);
  }
}
