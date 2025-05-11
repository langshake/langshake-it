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

## Usage

```bash
node src/cli/index.js --input src/pages --out public/langshake --llm public/.well-known/llm.json
```

## File Structure

- `src/cli/index.js` — CLI entry point
- `src/core/scanPages.js` — Scans for supported files
- `src/core/generateSchema.js` — Extracts and generates Schema.org JSON-LD
- `src/core/writeJsonLD.js` — Writes JSON-LD files, manages cache
- `src/core/buildLLMIndex.js` — Builds .well-known/llm.json with Merkle root
- `src/core/cache.js` — Handles cache read/write
- `public/langshake/` — Output JSON-LD files
- `public/.well-known/llm.json` — Global LLM index
- `tests/` — Unit and integration tests

## Testing

Run all tests with:

```bash
npx vitest
```

## Contributing

See `planning.md` and `whitepaper.md` for architecture and spec details.
