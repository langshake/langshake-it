import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { spawnSync } from 'child_process';

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
    // Split command for spawnSync: e.g., 'npm run build' => ['npm', ['run', 'build']]
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

  // TODO: Main extraction and processing logic goes here
})();
