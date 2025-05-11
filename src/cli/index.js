#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { spawnSync } from 'child_process';

// --- Langshake Core Imports ---
import { scanPages } from '../core/scanPages.js';
import { generateSchema } from '../core/generateSchema.js';
import { writeJsonLD } from '../core/writeJsonLD.js';
import { readCache, writeCache } from '../core/cache.js';
import { buildLLMIndex, loadLLMContext } from '../core/buildLLMIndex.js';

const CONFIG_FILE = path.resolve(process.cwd(), 'langshake.config.json');

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
  try {
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
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
  const keys = ['input', 'out', 'llm', 'build', 'force', 'dry-run', 'verbose'];
  const merged = {};
  for (const key of keys) {
    merged[key] = argv[key] !== undefined ? argv[key] : config[key];
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
    description: 'Input directory (e.g., src/pages)',
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for JSON-LD files',
  })
  .option('llm', {
    type: 'string',
    description: 'Path to .well-known/llm.json',
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
  .help()
  .argv;

// --- Main Extraction and Processing Logic ---
(async () => {
  // Load config and merge with CLI args
  const config = await loadConfig();
  const options = mergeOptions(config, argv);

  // Save new/changed options back to config
  await saveConfig(options);

  // Print effective options
  console.log(chalk.green.bold('Langshake CLI'));
  console.log(chalk.gray('For help, use --help.'));
  console.log(chalk.cyan('Using options:'));
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      console.log(`  ${key}: ${value}`);
    }
  }

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
  } else {
    console.log(chalk.yellow('No build command specified. Output may be stale.'));
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
  for (const file of files) {
    const slug = path.basename(file, path.extname(file));
    try {
      const schemas = await generateSchema(file);
      if (schemas.length === 0) {
        if (options.verbose) console.log(chalk.yellow(`No JSON-LD found in ${file}`));
        continue;
      }
      if (options['dry-run']) {
        console.log(chalk.blue(`[Dry Run] Would write: ${slug}.json`));
        skippedCount++;
        continue;
      }
      const result = await writeJsonLD(options.out, slug, schemas, cache);
      modules.push({ path: path.relative(process.cwd(), result.file), hash: result.hash });
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

  // 5. Site metadata (prompt if not in config)
  let site = config.site;
  if (!site) {
    site = {
      name: 'My Site',
      description: 'A site using Langshake',
      language: 'en',
    };
    // Optionally: prompt user for these fields in future
    await saveConfig({ ...config, site });
  }

  // 6. Load LLM context (optional)
  const llmContext = await loadLLMContext();

  // 7. Build LLM index
  try {
    if (!options['dry-run']) {
      await buildLLMIndex(options.llm, modules, site, llmContext);
      console.log(chalk.green(`LLM index written to ${options.llm}`));
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
