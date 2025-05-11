import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

/**
 * Langshake CLI entry point.
 * Parses arguments and displays a welcome message.
 */
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'Input directory (e.g., src/pages)',
    demandOption: true,
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for JSON-LD files',
    demandOption: true,
  })
  .option('llm', {
    type: 'string',
    description: 'Path to .well-known/llm.json',
    demandOption: true,
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

console.log(chalk.green.bold('Langshake CLI')); // Welcome message
console.log(chalk.gray('For help, use --help.'));

// Reason: This is a stub for the CLI entry point. Actual logic will be implemented in later steps.
