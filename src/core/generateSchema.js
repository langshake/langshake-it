import fs from 'fs-extra';
import * as cheerio from 'cheerio';

/**
 * Extracts all JSON-LD objects from <script type="application/ld+json"> in an HTML file.
 *
 * @param {string} filePath - Path to the compiled HTML file.
 * @returns {Promise<object[]>} Array of all JSON-LD objects found (empty if none).
 */
export async function generateSchema(filePath) {
  const results = [];
  try {
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html();
        if (!content || content.trim() === '') return;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          results.push(...parsed);
        } else {
          results.push(parsed);
        }
      } catch (err) {
        // Ignore JSON parse errors
      }
    });
    return results;
  } catch (err) {
    // Reason: File not found or unreadable, or no schema present
    return [];
  }
}
