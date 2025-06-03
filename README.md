# LangshakeIt CLI

**The easiest way to make your website AI- and LLM-friendly.**  
LangshakeIt generates verifiable, Schema.org-compliant JSON-LD for every page, plus a global `.well-known/llm.json` index for AI agents.

## Features

- 🔍 **Automatic structured data extraction** from built HTML (no framework lock-in)
- 🗂️ **Per-page JSON-LD** and a global `.well-known/llm.json` index
- 🔑 **Checksum & Merkle root validation** for data integrity
- ⚡ **Smart caching**: only updates changed files
- 🛠️ **Config auto-update**: always reflects your real public base URL
- 🧪 **Fully tested**: robust integration and unit tests

## Installation

```bash
git clone https://github.com/langshake/langshake-it
cd langshake-it
npm install
npm link   # For global CLI access (development)
```

## Quick Start

```bash
# 1. Initialize (creates config/context files)
langshakeit init

# 2. Build your static site (e.g., Next.js, Astro, etc.)
npm run build

# 3. Run LangshakeIt
langshakeit --input out --out public/langshake --llm public/.well-known/llm.json
```

- Your per-page JSON-LD will be in `langshake/`
- Your global index will be in `.well-known/llm.json`
- LLM/AI agents will discover your site via the standard `.well-known/llm.json` file

No arguments are needed if your config file `langshake.config.json` is set up - which happens on first run.

## CLI Usage & Options

```bash
langshakeit [options]
```

| Option         | Description                                                      | Default                      |
| -------------- | ---------------------------------------------------------------- | ---------------------------- |
| `--input`      | Directory to scan for built HTML files                           | `out`                        |
| `--out`        | Output directory for JSON-LD files                               | `public/langshake`           |
| `--llm`        | Path to `.well-known/llm.json`                                   | `public/.well-known/llm.json`|
| `--build`      | Build command to run before extraction                           | e.g., `"npm run build"`      |
| `--base-url`   | Fallback base URL if not auto-detected                           | `http://localhost`           |
| `--force`      | Force rebuild all files                                          | `false`                      |
| `--dry-run`    | Show what would be done without writing files                    | `false`                      |
| `--verbose`    | Enable verbose output                                            | `false`                      |

All options are saved to `langshake.config.json` and auto-updated after each run.

**Tip:** If your build command contains spaces (e.g., `npm run build`), wrap it in quotes: `--build "npm run build"`.

## Per-Page JSON-LD Output Format & Checksum

LangshakeIt outputs each page's extracted JSON-LD in a **universal, verifiable format**:

- The output is always an array, even if there is only one JSON-LD object.
- The **last element** of the array is always an object `{ "checksum": "..." }`.
- The checksum is calculated from the array of JSON-LD objects (excluding the checksum object itself).
- The original JSON-LD objects are not mutated or wrapped.

### **Single JSON-LD Object Example**

Extracted:
```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Xavier Macià's Portfolio"
    // ...other fields...
  }
]
```

Output:
```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Xavier Macià's Portfolio"
    // ...other fields...
  },
  {
    "checksum": "d331a28b4568528974860d703cde8b1dac5275e82449ece217c51e4b6882eee4"
  }
]
```

### **Multiple JSON-LD Objects Example**

Extracted:
```json
[
  { "@type": "WebPage", "name": "A" },
  { "@type": "WebPage", "name": "B" }
]
```

Output:
```json
[
  { "@type": "WebPage", "name": "A" },
  { "@type": "WebPage", "name": "B" },
  { "checksum": "..." }
]
```

### **How to Verify the Checksum**
1. Read the file as an array.
2. Remove the last element (the checksum object).
3. Calculate the checksum on the remaining array.
4. Compare to the value in the removed checksum object.

This format is universal, easy to verify, and works for both single and multiple JSON-LD objects.

## Adding LLM Context (Optional)

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

## Automate with npm Scripts

To automatically run LangshakeIt after every site build, add the following to your `package.json`, example Next.js:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "langshake": "langshakeit",
  "postbuild": "POSTBUILD=1 npm run langshake",
  "start": "next start",
  "lint": "next lint"
}
```

- On Windows, use: `"postbuild": "set POSTBUILD=1 && npm run langshake"`

Now, whenever you run `npm run build`, LangshakeIt will run automatically after your site is built, keeping your structured data up to date with no extra steps.

> **Warning:** If you run `langshakeit --build "npm run build"` and also have a postbuild script that runs LangshakeIt, it will cause LangshakeIt to run twice for every build. Use only one approach.

> **Tip:** Setting `POSTBUILD=1` in your postbuild script will suppress the build warning from LangshakeIt, since the build has already run.

## How It Works

1. **Scans your built HTML** for all pages in the `--input` directory.
2. **Extracts all JSON-LD** and writes per-page files.
3. **Builds a global `.well-known/llm.json`** with module URLs, Merkle root, and metadata.
4. **Auto-detects your public base URL** by checking (in order):
   - `robots.txt` (`Sitemap:` line)
   - `sitemap.xml` (first `<loc>`)
   - JSON-LD in your home page
   - `--base-url` config/CLI option
5. **LLM/AI discovery is handled solely via the standard `.well-known/llm.json` file.**
   - This approach follows web standards (RFC 8615) and has zero SEO impact.

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

## Testing

Run all tests with:
```bash
npx vitest
```

Integration tests use a real Next.js fixture site to ensure realistic, end-to-end extraction. All temp files and `node_modules` are cleaned up after each run.

## Extraction Pipeline

- Only built `.html` files are processed (no `.jsx`/`.mdx` source parsing)
- Extraction is robust to missing or malformed files
- The CLI never overwrites or deletes user files except the generated json files

## Validation & Style

- Uses [`zod`](https://github.com/colinhacks/zod) for data validation
- Enforces code style with ESLint and Prettier
- All code is modular, with clear separation of CLI, core logic, and tests

## About the LangShake Protocol

LangShake is a dual-layer micro-standard for machine-readable web content:

* **.well-known/llm.json**: Declares site-wide structured data modules & metadata
* **Modular JSON files**: Contain pure, schema.org-compliant JSON-LD arrays with checksums
* **Merkle root validation**: Ensures integrity across modules

Learn more: [whitepaper](https://github.com/langshake/langshake.github.io/blob/master/whitepaper.md)

---

## Companion Tool: Shakeproof CLI

After generating your `.well-known/llm.json` and per-page JSON-LD modules with LangshakeIt, you can verify, validate, and benchmark them using **[Shakeproof CLI](https://github.com/langshake/shake-proof)** — the official LangShake protocol testing suite.

Shakeproof ensures your structured data is not only well-formed, but also **trustworthy**, **accurate**, and **LLM-ready**.

### What It Does

- Compares your LangShake modules with traditional HTML-extracted Schema.org data
- Verifies **checksums** and recalculates the **Merkle root** to ensure data integrity
- Benchmarks structured data extraction **speed**, **accuracy**, and **trustworthiness**
- Reports errors, mismatches, and trust failures across your entire site
- Provides both CLI and programmatic SDK usage

> Use **LangshakeIt** to generate trusted structured data.  
> Use **Shakeproof** to validate and prove it.

GitHub Repo: [github.com/langshake/shakeproof](https://github.com/langshake/shake-proof)


## Get Involved

LangShake is fully open source (MIT) and community-driven.

We welcome:

* Web developers who want to expose AI-friendly content
* Toolmakers who want to integrate LangShake support
* Contributors to help expand crawler compatibility or reporting

GitHub: [github.com/langshake](https://github.com/langshake)

## License

MIT — Free to use, fork, improve, and adapt.

## Thanks

This project was inspired by the growing need for **verifiable**, **trustworthy**, and **machine-optimized** content delivery. We believe LangShake can be the `robots.txt` of the AI era.
