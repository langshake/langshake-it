import fs from 'fs-extra';
import * as cheerio from 'cheerio';

/**
 * Extracts site metadata from an array of JSON-LD schemas.
 * Prefers @type: WebSite, then Organization, then Person.
 *
 * @param {object[]} schemas - Array of JSON-LD objects
 * @returns {{ name: string|null, description: string|null, language: string|null }}
 */
export function extractSiteMetadataFromSchemas(schemas) {
  const siteSchema = schemas.find(s => s['@type'] === 'WebSite')
    || schemas.find(s => s['@type'] === 'Organization')
    || schemas.find(s => s['@type'] === 'Person');
  return {
    name: siteSchema?.name || null,
    description: siteSchema?.description || null,
    language: siteSchema?.inLanguage || siteSchema?.language || null,
  };
}

/**
 * Extracts site metadata from HTML content using cheerio.
 *
 * @param {string} html - HTML content
 * @returns {{ name: string|null, description: string|null, language: string|null }}
 */
export function extractSiteMetadataFromHTML(html) {
  const $ = cheerio.load(html);
  const name = $('title').text() || null;
  const description = $('meta[name="description"]').attr('content') || null;
  const language = $('html').attr('lang') || null;
  return { name, description, language };
}

/**
 * Extracts site metadata from a list of files (JSON-LD and HTML fallback).
 *
 * @param {string[]} files - List of HTML file paths
 * @param {function} generateSchema - Function to extract JSON-LD from a file
 * @returns {Promise<{ name: string, description: string, language: string }>}
 */
export async function extractSiteMetadata(files, generateSchema) {
  // Try all files for JSON-LD site metadata
  for (const file of files) {
    const schemas = await generateSchema(file);
    const meta = extractSiteMetadataFromSchemas(schemas);
    if (meta.name && meta.description && meta.language) return meta;
  }
  // Fallback: try HTML meta/title/lang from first file
  if (files.length > 0) {
    const html = await fs.readFile(files[0], 'utf-8');
    const meta = extractSiteMetadataFromHTML(html);
    if (meta.name && meta.description && meta.language) return meta;
  }
  // Fallback: use defaults
  return {
    name: 'My Site',
    description: 'A site using Langshake',
    language: 'en',
  };
} 