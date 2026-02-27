# DocMind AI

> **Talk to your documents.** Drop any PDF or text file and chat with it using AI.

Built with React + TypeScript + Vite + OpenAI + Framer Motion + GSAP.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your OpenAI API key

```bash
cp src/.env.example .env
```

Open `.env` and replace the placeholder:

```env
VITE_OPENAI_API_KEY=sk-...your-key-here...
```

> **No API key?** The app works in demo mode — it streams a mock response so you can see the UI in action.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Features

| Feature | Details |
|---|---|
| **PDF support** | Uses PDF.js (loaded from CDN) to extract text from any PDF |
| **TXT / MD support** | Native FileReader API |
| **AI Chat** | GPT-4o-mini via OpenAI SDK with streaming |
| **Demo mode** | Works without an API key — shows animated mock responses |
| **Markdown rendering** | AI responses render full markdown including code blocks |
| **Copy responses** | One-click copy on any AI message |
| **Suggested questions** | Quick-start prompts in the sidebar |

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **OpenAI SDK** — streaming chat completions
- **Framer Motion** — page transitions + message animations
- **GSAP** — hero entrance animations
- **react-dropzone** — drag & drop file handling
- **react-markdown** — markdown rendering in chat
- **PDF.js** (CDN) — PDF text extraction

---

## Project Structure

```
src/
├── components/
│   ├── LandingHero.tsx    # Full-screen hero with drop zone
│   ├── DropZone.tsx       # Drag & drop file uploader
│   ├── ChatInterface.tsx  # Split sidebar + chat layout
│   └── MessageBubble.tsx  # Individual message component
├── utils/
│   ├── pdfExtractor.ts    # PDF.js + FileReader text extraction
│   └── aiChat.ts          # OpenAI streaming + mock fallback
├── types/
│   └── index.ts           # Message + DocumentInfo types
├── App.tsx
└── index.css              # Design system + animations
```

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

> **Note:** Set `VITE_OPENAI_API_KEY` as an environment variable in your deployment settings. Never commit your `.env` file.
