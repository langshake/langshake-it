# LangshakeIt CLI

**The easiest way to make your website AI- and LLM-friendly.**  
LangshakeIt generates verifiable, Schema.org-compliant JSON-LD for every page, plus a global `.well-known/llm.json` index for AI agents—automatically discoverable via your `robots.txt`.

---

## Features

- 🔍 **Automatic structured data extraction** from built HTML (no framework lock-in)
- 🗂️ **Per-page JSON-LD** and a global `.well-known/llm.json` index
- 🔗 **AI/LLM discoverability**: auto-updates `robots.txt` with a `llm-json:` line
- 🔑 **Checksum & Merkle root validation** for data integrity
- ⚡ **Smart caching**: only updates changed files
- 🛠️ **Config auto-update**: always reflects your real public base URL
- 🧪 **Fully tested**: robust integration and unit tests

---

## Quick Start

```bash
# 1. Install
npm install -g langshakeit

# 2. Initialize (creates config/context files)
langshakeit init

# 3. Build your static site (e.g., Next.js, Astro, etc.)
npm run build

# 4. Run LangshakeIt
langshakeit --input out --out out/langshake --llm out/.well-known/llm.json
```

- Your per-page JSON-LD will be in `langshake/`
- Your global index will be in `.well-known/llm.json`
- Your `robots.txt` will be updated for LLM/AI discoverability

---

## Adding LLM Context (Recommended)

To provide additional site-level context, principles, or usage notes for LLMs, edit the `llm_context.json` file in your project root. This file is based on the provided `llm_context.example.json`:

```json
{
  "summary": "Langshake exposes structured, verifiable content for AI and LLM agents. This site provides Schema.org-compliant JSON-LD for every page, plus a global index for discovery and verification.",
  "principles": [
    "Transparency: All structured data is open and verifiable.",
    "Accuracy: Content is kept in sync with the site and validated against Schema.org.",
    "Privacy: No personal or sensitive data is exposed in the index."
  ],
  "usage_notes": [
    "LLM agents should use the .well-known/llm.json index to discover available modules and verify their integrity.",
    "Each module's JSON-LD file includes a checksum for tamper detection.",
    "The Merkle root in llm.json allows for efficient verification of all modules."
  ]
}
```

- **How to use:**
  - Copy `llm_context.example.json` to `llm_context.json` in your project root.
  - Edit `llm_context.json` to add your own summary, principles, usage notes, or whatever is useful to provide more context to LLMs
  - This context will be included in your `.well-known/llm.json` and is visible to LLMs and AI agents.
  - **Caution with Context Fields**: Fields like `llm_context.json` are unverified and should not be used for factual reasoning or truth-grounding by default.

---

## Automate with npm Scripts

To automatically run LangshakeIt after every site build, add the following to your `package.json`, example Next.js:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "langshake": "langshakeit",
  "postbuild": "npm run langshake",
  "start": "next start",
  "lint": "next lint"
}
```

Now, whenever you run `npm run build`, LangshakeIt will run automatically after your site is built, keeping your structured data up to date with no extra steps.

---

## How It Works

1. **Scans your built HTML** for all pages in the `--input` directory.
2. **Extracts all JSON-LD** and writes per-page files.
3. **Builds a global `.well-known/llm.json`** with module URLs, Merkle root, and metadata.
4. **Auto-detects your public base URL** by checking (in order):
   - `robots.txt` (`Sitemap:` line)
   - `sitemap.xml` (first `<loc>`)
   - JSON-LD in your home page
   - `--base-url` config/CLI option
5. **Updates `robots.txt`** to include:
   ```
   llm-json: https://yourdomain.com/.well-known/llm.json
   ```
   (if not already present)

---

## CLI Usage & Options

```bash
langshakeit [options]
```

| Option         | Description                                                      | Default                      |
| -------------- | ---------------------------------------------------------------- | ---------------------------- |
| `--input`      | Directory to scan for built HTML files                           | `out`                        |
| `--out`        | Output directory for JSON-LD files                               | `public/langshake`           |
| `--llm`        | Path to `.well-known/llm.json`                                   | `public/.well-known/llm.json`|
| `--build`      | Build command to run before extraction                           |                              |
| `--base-url`   | Fallback base URL if not auto-detected                           | `http://localhost`           |
| `--force`      | Force rebuild all files                                          | `false`                      |
| `--dry-run`    | Show what would be done without writing files                    | `false`                      |
| `--verbose`    | Enable verbose output                                            | `false`                      |

All options are saved to `langshake.config.json` and auto-updated after each run.

---

## File Structure & Outputs

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

---

## Testing

Run all tests with:
```bash
npx vitest
```

Integration tests use a real Next.js fixture site to ensure realistic, end-to-end extraction. All temp files and `node_modules` are cleaned up after each run.

---

## Extraction Pipeline

- Only built `.html` files are processed (no `.jsx`/`.mdx` source parsing)
- Extraction is robust to missing or malformed files
- The CLI never overwrites or deletes user files—except to append the `llm-json` line to robots.txt if needed

---

## Validation & Style

- Uses [`zod`](https://github.com/colinhacks/zod) for data validation
- Enforces code style with ESLint and Prettier
- All code is modular, with clear separation of CLI, core logic, and tests

---

## Security & Dependencies

- The Next.js fixture uses version `^14.2.4` (latest at time of writing)
- Keep your dependencies up to date for security

---

## Contributing

- All code is modular, with clear separation of CLI, core logic, and tests.
- When adding new test fixtures, ensure they are minimal, realistic, and cleaned up after tests.

---

## Links & References

- [Whitepaper](./whitepaper.md)
- [Schema.org](https://schema.org/)

---

**LangshakeIt: Make your site ready for the AI web.**
