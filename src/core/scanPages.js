import { globby } from 'globby';
import fs from 'fs-extra';

/**
 * Scans the input directory for supported files (.jsx, .mdx).
 *
 * @param {string} inputDir - Directory to scan.
 * @returns {Promise<string[]>} List of file paths.
 */
export async function scanPages(inputDir) {
  // Check if directory exists
  const exists = await fs.pathExists(inputDir);
  if (!exists) {
    // Reason: Gracefully handle missing directory
    return [];
  }
  // Use globby to find .jsx and .mdx files recursively
  const patterns = [
    '**/*.jsx',
    '**/*.mdx',
  ];
  try {
    const files = await globby(patterns, {
      cwd: inputDir,
      absolute: true,
      onlyFiles: true,
      followSymbolicLinks: true,
    });
    return files;
  } catch (err) {
    // Reason: Gracefully handle unreadable directories (e.g., EACCES)
    return [];
  }
}
