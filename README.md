# CropBook 📖✂️

**CropBook** is an intelligent system designed to automatically "crop" and extract specific segments from books based on your textual descriptions. Whether you need to find all mentions of a specific event, extract character descriptions, or gather thematic snippets, CropBook does the heavy lifting for you.

## 🌟 Features

*   **Multi-Format Support:** Upload digital copies of books in various formats (PDF, EPUB, TXT, etc.).
*   **Intelligent Recognition:** Advanced OCR and text processing to accurately parse book content.
*   **Semantic Search & Extraction:** Describe what you are looking for in plain language, and the system will find and "cut out" the relevant sections.
*   **Smart Cropping:** Automatically identifies the boundaries of paragraphs or chapters related to your request.

## 🛠 Tech Stack

*   **Runtime:** Node.js
*   **Package Manager:** pnpm
*   **NLP/LLM:** LangChain.js / OpenAI SDK / Transformers.js
*   **OCR:** Tesseract.js / PDF-parse
*   **Language:** TypeScript (optional, but recommended)

## 🚀 Installation

Make sure you have [pnpm](https://pnpm.io) installed.

```bash
# Clone the repository
git clone https://github.com/day0ff/cropbook

# Install dependencies using pnpm
cd cropbook
pnpm install
```

## 📖 Usage

```typescript
```

## 🛠 Scripts

- `pnpm dev`: Start the development server.
- `pnpm build`: Build the project for production.
- `pnpm lint`: Run lint checking.


## How to add new skill for ai instruction
 - Add any existing github ai skill
```bash
npx skills add <<path-to-github-repo>>
```
 - NestJS
```bash
npx skills add Kadajett/agent-nestjs-skills
```
 - React vercel
```bash
npx skills add vercel-labs/agent-skills
```