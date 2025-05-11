# Langshake CLI

Langshake is a CLI tool for generating Schema.org-compliant, verifiable JSON-LD files for every page on a site, plus a global .well-known/llm.json index for AI and LLM agents.

## Project Vision

- Streamline structured content exposure for AI agents and LLMs
- Output per-page JSON-LD and a global index with Merkle root validation
- Smart caching to only update changed content

## Setup

```bash
npm install
```

### Optional: Custom LLM Context

If you want to provide custom context for LLMs (such as a summary, principles, or usage notes), copy the example file to your project root:

```bash
cp llm_context.example.json llm_context.json
```

Edit `llm_context.json` to fit your site. This file will be included in your `.well-known/llm.json` index if present.

## Usage

```bash
node src/cli/index.js --input src/pages --out public/langshake --llm public/.well-known/llm.json --build "npm run build"
```

## Configuration and Persistent Options

Langshake CLI automatically saves your options to `langshake.config.json` in your project root. On subsequent runs, if you omit any options, the CLI will use the saved values. You can override any option at any time by specifying it again on the command line.

- **--input**: Input directory to scan for pages (e.g., `src/pages`)
- **--out**: Output directory for JSON-LD files
- **--llm**: Path to `.well-known/llm.json`
- **--build**: Build command to run before extraction (e.g., `npm run build`)
- **--force, --dry-run, --verbose**: Additional options for control and output

Each time you run the CLI, it prints the effective options being used (from CLI args and/or config) so you always know what's active.

## How Pages Are Discovered

Langshake determines what pages to process by scanning the input directory (e.g., `src/pages` or a test fixture path) for files matching these patterns:

- `**/*.jsx` — All `.jsx` files, recursively
- `**/*.mdx` — All `.mdx` files, recursively

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
│   │   ├── nextjs/
│   │   │   └── pages/
│   │   │       ├── about.jsx
│   │   │       └── contact.mdx
│   │   └── html/
│   │       └── benchmark.html
│   ├── scanPages.test.js
│   ├── generateSchema.test.js
│   ├── writeJsonLD.test.js
│   ├── cache.test.js
│   └── integration.writeJsonLD.test.js
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

## Contributing

See `planning.md` and `whitepaper.md` for architecture and spec details.
