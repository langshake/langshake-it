#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { spawnSync } from 'child_process';
import xml2js from 'xml2js';

// --- Langshake Core Imports ---
import { scanPages } from '../core/scanPages.js';
import { generateSchema } from '../core/generateSchema.js';
import { writeJsonLD } from '../core/writeJsonLD.js';
import { readCache, writeCache } from '../core/cache.js';
import { buildLLMIndex, loadLLMContext } from '../core/buildLLMIndex.js';
import { extractSiteMetadata } from '../core/extractSiteMetadata.js';

const CONFIG_FILE = path.resolve(process.cwd(), 'langshake.config.json');
const DEFAULT_INPUT = 'out';
const DEFAULT_OUT = 'public/langshake';
const DEFAULT_LLM = 'public/.well-known/llm.json';

/**
 * Load config from langshake.config.json if it exists.
 * @returns {Promise<object>} Config object or {}
 */
async function loadConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      return await fs.readJson(CONFIG_FILE);
    }
  } catch (e) {
    // Reason: Ignore config read errors, fallback to defaults
  }
  return {};
}

/**
 * Save config to langshake.config.json
 * @param {object} config - Config object to save
 * @returns {Promise<void>}
 */
async function saveConfig(config) {
  const { build, ...configToSave } = config;
  try {
    await fs.writeJson(CONFIG_FILE, configToSave, { spaces: 2 });
  } catch (e) {
    console.warn(chalk.yellow('Warning: Could not save config file.'));
  }
}

/**
 * Merge CLI args with config file (CLI takes precedence)
 * @param {object} config - Loaded config
 * @param {object} argv - CLI args
 * @returns {object} Effective options
 */
function mergeOptions(config, argv) {
  // Only persist known options
  const keys = ['input', 'out', 'llm', 'build', 'force', 'dry-run', 'verbose', 'base-url'];
  const merged = {};
  for (const key of keys) {
    if (key === 'input') {
      merged[key] = argv[key] !== undefined ? argv[key] : (config[key] !== undefined ? config[key] : DEFAULT_INPUT);
    } else if (key === 'out') {
      merged[key] = argv[key] !== undefined ? argv[key] : (config[key] !== undefined ? config[key] : DEFAULT_OUT);
    } else if (key === 'llm') {
      merged[key] = argv[key] !== undefined ? argv[key] : (config[key] !== undefined ? config[key] : DEFAULT_LLM);
    } else {
      merged[key] = argv[key] !== undefined ? argv[key] : config[key];
    }
  }
  return merged;
}

/**
 * Langshake CLI entry point.
 * Parses arguments and displays a welcome message.
 */
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'Input directory (e.g., out, public, or your framework\'s build output)',
    default: DEFAULT_INPUT,
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for JSON-LD files',
    default: DEFAULT_OUT,
  })
  .option('llm', {
    type: 'string',
    description: 'Path to .well-known/llm.json',
    default: DEFAULT_LLM,
  })
  .option('build', {
    type: 'string',
    description: 'Build command to run before extraction (e.g., "npm run build")',
  })
  .option('force', {
    type: 'boolean',
    description: 'Force rebuild all files',
    default: false,
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'Show what would be done without writing files',
    default: false,
  })
  .option('verbose', {
    type: 'boolean',
    description: 'Enable verbose output',
    default: false,
  })
  .option('base-url', {
    type: 'string',
    description: 'Public base URL for the site (e.g., https://xevi.work)',
    default: 'http://localhost',
  })
  .help()
  .argv;

function getDefaultConfig() {
  return {
    input: DEFAULT_INPUT,
    out: DEFAULT_OUT,
    llm: DEFAULT_LLM,
    build: undefined,
    force: false,
    'dry-run': false,
    verbose: false,
    'base-url': 'http://localhost',
  };
}

/**
 * Extract the base URL from robots.txt, sitemap.xml, or JSON-LD.
 * Priority: robots.txt (Sitemap:), then sitemap.xml, then JSON-LD, then config.
 * @param {string[]} possibleDirs - List of possible directories to check for robots.txt and sitemap.xml
 * @param {string[]} files - List of HTML file paths
 * @param {function} generateSchema - Function to extract JSON-LD from a file
 * @param {string} configBaseUrl - CLI/config base URL fallback
 * @returns {Promise<string>} The detected base URL
 */
async function detectBaseUrl(possibleDirs, files, generateSchema, configBaseUrl) {
  const fs = (await import('fs-extra')).default;
  const path = (await import('path')).default;
  for (const publicDir of possibleDirs) {
    // 1. robots.txt
    const robotsPath = path.join(publicDir, 'robots.txt');
    if (await fs.pathExists(robotsPath)) {
      const robotsContent = await fs.readFile(robotsPath, 'utf-8');
      const sitemapLine = robotsContent.split('\n').find(line => line.trim().toLowerCase().startsWith('sitemap:'));
      if (sitemapLine) {
        const sitemapUrl = sitemapLine.split(':')[1]?.trim();
        if (sitemapUrl && sitemapUrl.startsWith('http')) {
          try {
            const urlObj = new URL(sitemapUrl);
            return urlObj.origin;
          } catch {}
        }
      }
    }
    // 2. sitemap.xml
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    if (await fs.pathExists(sitemapPath)) {
      const sitemapContent = await fs.readFile(sitemapPath, 'utf-8');
      try {
        const parsed = await xml2js.parseStringPromise(sitemapContent);
        const firstLoc = parsed?.urlset?.url?.[0]?.loc?.[0];
        if (typeof firstLoc === 'string' && firstLoc.startsWith('http')) {
          const urlObj = new URL(firstLoc);
          return urlObj.origin;
        }
      } catch {}
    }
  }
  // 3. JSON-LD from first HTML file
  if (files.length > 0) {
    const schemas = await generateSchema(files[0]);
    let url = schemas[0]?.url || schemas[0]?.['@id'];
    if (!url && schemas[0]?.mainEntityOfPage) {
      url = schemas[0].mainEntityOfPage.url || schemas[0].mainEntityOfPage['@id'];
    }
    if (typeof url === 'string' && url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        return urlObj.origin;
      } catch {}
    }
  }
  // 4. Fallback to config/CLI
  return configBaseUrl || 'http://localhost';
}

(async () => {
  async function ensureConfig() {
    if (!(await fs.pathExists(CONFIG_FILE))) {
      await saveConfig(getDefaultConfig());
      console.log(chalk.green('langshake.config.json initialized with default settings.'));
    }
  }

  if (process.argv.includes('init')) {
    await saveConfig(getDefaultConfig());
    console.log(chalk.green('langshake.config.json initialized with default settings.'));
    process.exit(0);
  }

  // Auto-init config if missing
  await ensureConfig();

  // --- Main Extraction and Processing Logic ---
  // (move your main CLI logic here)
  // Load config and merge with CLI args
  let config = await loadConfig();
  let options = mergeOptions(config, argv);

  // Safeguard: If in postbuild and build is set, warn, ignore, and clean config
  if (process.env.npm_lifecycle_event === 'postbuild' && options.build) {
    console.error(chalk.red('Warning: --build should not be used in postbuild. Ignoring build command to prevent recursion.'));
    delete options.build;
    if (config.build) {
      delete config.build;
      await saveConfig(config);
    }
  }

  // Save new/changed options back to config (without build)
  await saveConfig(options);

  // Build step integration
  if (options.build) {
    console.log(chalk.blue(`\nRunning build command: ${options.build}`));
    const [cmd, ...args] = options.build.split(' ');
    const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
    if (result.status !== 0) {
      console.error(chalk.red(`Build command failed with exit code ${result.status}. Aborting.`));
      process.exit(result.status || 1);
    }
    console.log(chalk.green('Build completed successfully.'));
  } else if (!process.env.POSTBUILD) {
    console.log(chalk.yellow('No build command specified. Your build output may be stale.'));
  }

  // --- Main Pipeline ---
  // 1. Scan for pages
  if (!options.input || !options.out || !options.llm) {
    console.error(chalk.red('Missing required options: --input, --out, --llm. Please specify them on first run.'));
    process.exit(1);
  }

  const files = await scanPages(options.input);
  if (files.length === 0) {
    console.warn(chalk.yellow('No supported files found in input directory. Nothing to process.'));
    process.exit(0);
  }
  if (options.verbose) {
    console.log(chalk.gray(`Found ${files.length} files to process.`));
  }

  // 2. Load cache
  let cache = await readCache();
  let modules = [];
  let writtenCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 3. Process each file
  const siteRoot = path.resolve(process.cwd(), options.input);
  const baseUrl = await detectBaseUrl([siteRoot], files, generateSchema, options['base-url'] || 'http://localhost');
  options['base-url'] = baseUrl;
  await saveConfig(options);

  // Print effective options (after base-url detection)
  console.log(chalk.green.bold('Langshake CLI'));
  console.log(chalk.gray('For help, use --help.'));
  console.log(chalk.cyan('Using options:'));
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      console.log(`  ${key}: ${value}`);
    }
  }

  for (const file of files) {
    try {
      const schemas = await generateSchema(file);
      if (schemas.length === 0) {
        if (options.verbose) console.log(chalk.yellow(`No JSON-LD found in ${file}`));
        continue;
      }
      // Derive slug from url if present and valid
      let slug;
      const url = schemas[0]?.url;
      if (typeof url === 'string') {
        try {
          const u = new URL(url);
          // Remove leading/trailing slashes from pathname, replace / with .
          let pathPart = u.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
          slug = pathPart.replace(/\//g, '.');
          if (!slug) slug = 'index';
        } catch {
          // If URL parsing fails, fallback to filename
          slug = path.basename(file, path.extname(file));
        }
      } else {
        slug = path.basename(file, path.extname(file));
      }
      // Ensure home page is saved as index.json
      let filename = slug === '' ? 'index' : slug;
      if (filename === undefined || filename === null || filename === '') filename = 'index';
      if (options['dry-run']) {
        console.log(chalk.blue(`[Dry Run] Would write: ${filename}.json`));
        skippedCount++;
        continue;
      }
      const result = await writeJsonLD(options.out, filename, schemas, cache);
      // Construct the public URL for the module
      const moduleUrl = `${baseUrl.replace(/\/$/, '')}/langshake/${filename}.json`;
      modules.push({ path: moduleUrl, hash: result.hash });
      if (result.written || options.force) {
        writtenCount++;
        if (options.verbose) console.log(chalk.green(`Wrote: ${result.file}`));
      } else {
        skippedCount++;
        if (options.verbose) console.log(chalk.gray(`Skipped (unchanged): ${result.file}`));
      }
    } catch (err) {
      errorCount++;
      console.error(chalk.red(`Error processing ${file}: ${err.message}`));
    }
  }

  // 4. Save cache
  if (!options['dry-run']) {
    await writeCache(undefined, cache);
  }

  // 5. Site metadata (extract from files)
  const site = await extractSiteMetadata(files, generateSchema);

  // 6. Load LLM context (optional)
  const llmContext = await loadLLMContext();

  // 7. Build LLM index
  try {
    if (!options['dry-run']) {
      await buildLLMIndex(options.llm, modules, site, llmContext);
      console.log(chalk.green(`LLM index written to ${options.llm}`));

      // --- robots.txt handling ---
      const baseUrl = options['base-url'];
      const llmLine = `llm-json: ${baseUrl}/.well-known/llm.json`;
      const publicRobotsPath = path.resolve(process.cwd(), 'public/robots.txt');
      const outRobotsPath = path.resolve(process.cwd(), 'out/robots.txt');
      const publicRobotsExists = await fs.pathExists(publicRobotsPath);
      const outRobotsExists = await fs.pathExists(outRobotsPath);
      let isStatic = false;
      if (publicRobotsExists) {
        let publicContent = await fs.readFile(publicRobotsPath, 'utf-8');
        if (publicContent.length > 0 && outRobotsExists) {
          const outContent = await fs.readFile(outRobotsPath, 'utf-8');
          if (publicContent === outContent) {
            isStatic = true;
            // Update/add llm-json line if needed
            let lines = publicContent.split('\n');
            const llmIndex = lines.findIndex(line => line.trim().startsWith('llm-json:'));
            if (llmIndex === -1) {
              // Add
              if (!publicContent.endsWith('\n')) publicContent += '\n';
              publicContent += '\n' + llmLine + '\n';
              await fs.writeFile(publicRobotsPath, publicContent, 'utf-8');
              await fs.writeFile(outRobotsPath, publicContent, 'utf-8');
              console.log(chalk.green('Added llm-json reference to robots.txt.'));
            } else if (lines[llmIndex].trim() !== llmLine) {
              // Replace
              const updatedContent = lines.map((line, idx) => idx === llmIndex ? llmLine : line).join('\n');
              await fs.writeFile(publicRobotsPath, updatedContent, 'utf-8');
              await fs.writeFile(outRobotsPath, updatedContent, 'utf-8');
              console.log(chalk.green('Updated llm-json reference in robots.txt.'));
            } else {
              // Already correct
              console.log(chalk.gray('llm-json reference already correct in robots.txt.'));
            }
          }
        }
      }
      if (!isStatic) {
        // Dynamic or ambiguous
        console.log(chalk.yellow('robots.txt is likely dynamic (public/robots.txt is missing, empty, or does not match out/robots.txt). Please ensure the following llm-json line is included in your dynamic robots.txt logic:'));
        console.log(llmLine);
      }
    } else {
      console.log(chalk.blue(`[Dry Run] Would build LLM index at ${options.llm}`));
    }
  } catch (err) {
    errorCount++;
    console.error(chalk.red(`Error building LLM index: ${err.message}`));
  }

  // 8. Summary
  console.log(chalk.bold(`\nSummary:`));
  console.log(`  Files processed: ${files.length}`);
  console.log(`  JSON-LD written: ${writtenCount}`);
  console.log(`  Skipped (unchanged/dry-run): ${skippedCount}`);
  if (errorCount > 0) {
    console.log(chalk.red(`  Errors: ${errorCount}`));
  }
  console.log(chalk.green('Done.'));
})();