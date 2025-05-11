# PLANNING.md

## 🧭 Project Vision

The future of web content is machine-readable. Langshake aims to streamline how developers expose structured content to AI agents and LLMs by generating schema-compliant, verifiable JSON-LD files for every page on a site.

This project builds a **CLI tool (`langshake-gen`)** that automatically scans a project (starting with Next.js), extracts structured content, and outputs:

- Per-page Schema.org-compatible JSON-LD files
- A global `.well-known/llm.json` index
- Checksum and Merkle root validation
- Smart caching to only update changed content

The result is a fully AI-compatible, SEO-enhancing, machine-verifiable site structure that works across frameworks.

---

## 🏗 Architecture Overview

### Core Modules

* **Page Scanner**:
  - Scans `src/pages` or equivalent for `.jsx`, `.mdx`, `.html`
  - Extracts relevant content (title, body, metadata)

* **Schema Generator**:
  - Outputs Schema.org-compliant JSON-LD files to `public/langshake/*.json`

* **Index Builder**:
  - Builds `.well-known/llm.json` pointing to each module with verification metadata
  - Includes Merkle root of all modules

* **Cache Engine**:
  - Stores SHA-256 hashes of previous JSON-LD outputs
  - Only regenerates files if content changed

---

## 🧰 Tech Stack

* Node.js (>=18.x)
* JavaScript (ES6+)
* `@babel/parser` or `recma` (for `.jsx` / `.mdx`)
* `crypto` (SHA-256 and Merkle root)
* `globby`, `fs-extra`
* `chalk`, `yargs` for CLI
* `vitest` for testing

---

## 📦 File Structure

/
├── src/
│ ├── cli/
│ │ └── index.js
│ ├── core/
│ │ ├── scanPages.js
│ │ ├── generateSchema.js
│ │ ├── writeJsonLD.js
│ │ ├── buildLLMIndex.js
│ │ └── cache.js
├── public/
│ ├── langshake/
│ └── .well-known/llm.json
├── tests/
│ ├── scanPages.test.js
│ └── pages/
│     ├── about.jsx
│     └── contact.mdx
├── .langshake-cache.json
├── package.json
└── README.md

---

## 🔒 Constraints

* All JSON-LD files must comply with Schema.org and Langshake whitepaper guidelines.
* No framework lock-in — support Next.js first, but design modularly for others.
* `.well-known/llm.json` must reflect updated modules and Merkle root.
* Cache must prevent rebuild of unchanged content.
* CLI must work even without Git (no dependency on Git internals).

---

## 📈 Output Criteria

* Structured JSON-LD files in `/public/langshake/*.json`
* `/.well-known/llm.json` with metadata, context, Merkle root
* Cache that persists between runs
* Minimal or no re-processing for unchanged files

---

## 🌱 Future Extensions

* HTML mode: scan built static sites or live-crawled HTML
* Git-based optimizations
* Langshake Validate (`langshake-validate`)
* Framework adapters: Astro, WordPress, Hugo, etc.

