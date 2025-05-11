import { createHash } from 'crypto';

/**
 * Calculate the SHA-256 checksum of a module JSON, excluding the checksum field.
 * @param {object} modJson
 * @returns {string} hex string
 */
export function calculateModuleChecksum(modJson) {
  const filtered = Object.fromEntries(Object.entries(modJson).filter(([k]) => k !== 'checksum'));
  const jsonStr = JSON.stringify(filtered);
  return createHash('sha256').update(jsonStr).digest('hex');
}

/**
 * Calculate a simple Merkle root from an array of hex string leaves (checksums).
 * @param {string[]} leaves
 * @returns {string} Merkle root as hex string
 */
export function calculateMerkleRoot(leaves) {
  if (leaves.length === 0) return '';
  let level = leaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        const hash = createHash('sha256')
          .update(level[i] + level[i + 1])
          .digest('hex');
        next.push(hash);
      } else {
        const hash = createHash('sha256')
          .update(level[i] + level[i])
          .digest('hex');
        next.push(hash);
      }
    }
    level = next;
  }
  return level[0];
} 