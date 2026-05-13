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

Install necessary libs:

 - System libraries for graphics

```bash
sudo apt install -y \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    libsm6 \\
    libxext6 \\
    libxrender-dev \\
    libgomp1 \\
    libgthread-2.0-0 \\
    libgtk2.0-dev \\
    pkg-config
```

 - Python Environment and Package Manager

```bash
sudo apt install -y python3 python3-pip python3-dev
```

 - Installing the AI core (PaddlePaddle and PaddleOCR)

```bash
pip3 install --user paddlepaddle
pip3 install --user paddlepaddle-gpu
pip3 install --user paddleocr
```

 - Health check in the console

```bash
paddleocr --version
# or
python3 -c 'import paddleocr; print("PaddleOCR installed successfully!")'

```
- On ruamel.yaml not installed error
```bash
python3 -m pip install ruamel.yaml
#or
/usr/bin/python3 -m pip install --user ruamel.yaml
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