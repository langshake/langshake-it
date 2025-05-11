# Langshake CLI

Langshake is a CLI tool for generating Schema.org-compliant, verifiable JSON-LD files for every page on a site, plus a global .well-known/llm.json index for AI and LLM agents.

## Installation

Install globally:
```bash
npm install -g langshakeit
```

Or as a dev dependency in your project:
```bash
npm install --save-dev langshakeit
```

## Quick Start: Project Initialization

Before your first run, scaffold recommended config/context files with:

```bash
langshakeit init
```

This will:
- Ensure `.langshake-cache.json` exists (created if missing)
- Ensure `llm_context.example.json` exists (created if missing)
- Optionally offer to create `llm_context.json` (recommended for custom LLM context, but not required)
- Ensure output folders (`public/langshake`, `public/.well-known`) exist

You can safely run `langshakeit init` multiple times. It will never overwrite existing files.

## Usage

Build your site locally (e.g., `npm run build` for Next.js, Astro, etc.), then run:

```bash
langshakeit --input <built_html_dir> --out <jsonld_out_dir> --llm <llm.json>
```

Or, to automate the build step:

```bash
langshakeit --build "npm run build" --input <built_html_dir> --out <jsonld_out_dir> --llm <llm.json>
```

You can also add a script to your `package.json`:
```json
"scripts": {
  "langshake": "langshakeit --input out/ --out public/langshake --llm public/.well-known/llm.json"
}
```

## Project Vision

- Streamline structured content exposure for AI agents and LLMs
- Output per-page JSON-LD and a global index with Merkle root validation
- Smart caching to only update changed content

## Setup

### Optional: Custom LLM Context

If you want to provide custom context for LLMs (such as a summary, principles, or usage notes), copy the example file to your project root:

```bash
cp llm_context.example.json llm_context.json
```

Edit `llm_context.json` to fit your site. This file will be included in your `.well-known/llm.json` index if present.

## Configuration and Persistent Options

Langshake CLI automatically saves your options to `langshake.config.json` in your project root. On subsequent runs, if you omit any options, the CLI will use the saved values. You can override any option at any time by specifying it again on the command line.

- **--input**: Input directory to scan for built HTML files (e.g., `out/`, `public/`, or your framework's build output)
- **--out**: Output directory for JSON-LD files
- **--llm**: Path to `.well-known/llm.json`
- **--build**: Build command to run before extraction (e.g., `npm run build`)
- **--force, --dry-run, --verbose**: Additional options for control and output

Each time you run the CLI, it prints the effective options being used (from CLI args and/or config) so you always know what's active.

## How Pages Are Discovered

Langshake determines what pages to process by scanning the input directory (e.g., your built HTML output) for files matching this pattern:

- `**/*.html` — All `.html` files, recursively

The CLI uses the `scanPages` function to:
- Traverse the specified input directory
- Find all supported files (including in subdirectories)
- Return a list of absolute file paths

This list is then used to generate JSON-LD and build the global index. If the directory is missing, empty, or unreadable, it is handled gracefully and no pages are processed.

## File Structure

```
/
├── src/
│   ├── cli/
│   │   └── index.js
│   ├── core/
│   │   ├── scanPages.js
│   │   ├── generateSchema.js
│   │   ├── writeJsonLD.js
│   │   ├── buildLLMIndex.js
│   │   └── cache.js
├── public/
│   ├── langshake/
│   └── .well-known/llm.json
├── tests/
│   ├── fixtures/
│   │   ├── simple-site/
│   │   │   └── src/pages/
│   │   │       ├── about.html
│   │   │       └── contact.mdx
│   │   └── html/
│   │       └── benchmark.html
│   ├── scanPages.test.js
│   ├── generateSchema.test.js
│   ├── writeJsonLD.test.js
│   ├── cache.test.js
│   ├── buildLLMIndex.test.js
│   └── integration.cli.test.js
├── .langshake-cache.json
├── langshake.config.json
├── package.json
└── README.md
```

## Testing

Run all tests with:

```bash
npx vitest
```

## Integration Testing & Fixtures

Langshake's integration tests use a real Next.js fixture site (`simple-site`) to ensure realistic, end-to-end extraction:

- Only the `simple-site` fixture is used for integration tests (no more `jsx-site` or `html-site`)
- The test suite builds the Next.js app, runs the CLI, and verifies JSON-LD and `.well-known/llm.json` outputs
- All temp files and `node_modules` are cleaned up after each run—tests never pollute your main project
- You can add new fixtures under `tests/fixtures/`, but keep them minimal and realistic

Run all tests (unit + integration):

```bash
npm test
```

## Extraction Pipeline

- Only built `.html` files are processed (no `.jsx`/`.mdx` source parsing)
- Extraction is robust to missing or malformed files
- The CLI never overwrites or deletes user files—safe to run in any project

## Validation & Style

- Uses [`zod`](https://github.com/colinhacks/zod) for data validation
- Enforces code style with ESLint and Prettier
- All code is modular, with clear separation of CLI, core logic, and tests

## Security & Dependencies

- The Next.js fixture uses version `^14.2.4` (latest at time of writing)
- Keep your dependencies up to date for security

## Contributing

- See `whitepaper.md` for architecture and spec details
- When adding new test fixtures, ensure they are cleaned up after tests
- Follow the modular structure and style conventions
