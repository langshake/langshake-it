# TASK.md

## ✅ Completed

* Define Langshake CLI scope in `PLANNING.md`
* Set up CLI project folder and `package.json`
* Initialize Git repo and `package.json`
* Install core dependencies: `chalk`, `yargs`, `fs-extra`, `globby`, `crypto`
* Create test folder for future fixtures
* Add dev dependencies: `vitest`, `eslint`, `prettier`, `zod`
* Create initial file structure and stubs for all core modules
* Add example test pages (`about.jsx`, `contact.mdx`)
* Add placeholder for `.langshake-cache.json` and `.well-known/llm.json`
* Add initial README and scripts

---

## 🔨 Current Tasks

### 🔧 Core Functionality

- [ ] `scanPages.js`
  - Traverse `src/pages` or given input path
  - Identify supported files (`.jsx`, `.mdx`)
  - Return structured file list for processing

- [ ] `generateSchema.js`
  - Parse page source (stub for now)
  - Extract title, body, headings (mock data for MVP)
  - Return Schema.org JSON-LD structure

- [ ] `writeJsonLD.js`
  - Write JSON-LD to `/public/langshake/[slug].json`
  - Compute hash and compare with cache
  - Skip write if hash unchanged

- [ ] `buildLLMIndex.js`
  - Generate `.well-known/llm.json`
  - Aggregate all current hashes
  - Compute Merkle root and embed

- [ ] `cache.js`
  - Read/write `.langshake-cache.json`
  - Compare content hash for rebuild logic

---

## 💻 CLI Interface

- [ ] `cli/index.js`
  - Accept `--input`, `--out`, `--llm`, `--force`
  - Show output summary and warnings
  - Allow dry-run or verbose mode

---

## 🧪 Testing

- [ ] Unit test for hash cache (compare, update)
- [ ] Integration test to generate `.json` for example `.jsx` page
- [ ] Validate `.llm.json` matches output structure and hashes
- [ ] Error handling (bad path, file unreadable, bad JSON)

---

## 📝 Docs

- [ ] Create example site (`about.jsx`, `contact.mdx`)
- [ ] Update README with:
  - Usage instructions
  - File structure
  - Schema conventions

---

## Discovered During Work

- [ ] (Add new TODOs here as they arise)
