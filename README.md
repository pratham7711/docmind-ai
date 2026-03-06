# 🧠 DocMind AI

> **RAG-powered PDF chat app — upload any document and ask questions in plain English.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-6366f1?style=for-the-badge&logo=vercel)](https://frontend-mu-five-51.vercel.app)

---

## ✨ Features

- 📄 **PDF & document upload** — drag-and-drop any PDF; text is extracted and chunked automatically
- 🔍 **Retrieval-Augmented Generation** — relevant chunks are fetched from Pinecone before each answer, keeping responses grounded and accurate
- ⚡ **Gemini Flash inference** — fast, high-quality answers powered by Google's Gemini Flash model via LangChain
- 💬 **Streaming responses** — answers stream token-by-token via SSE so you see results instantly
- 🔐 **Auth with NextAuth** — secure sign-in with session management
- 🗂️ **Conversation history** — previous chats are persisted and reloadable per document
- 🌗 **Polished UI** — built with Next.js 14 App Router, Tailwind CSS, and smooth animations

---

## 🖼️ Screenshot

> _Add a screenshot here — e.g. `public/screenshot.png`_

![DocMind AI Screenshot](public/screenshot.png)

---

## 🛠️ Tech Stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=fff)

**Backend**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=fff)
![Python](https://img.shields.io/badge/Python%203.11-3776AB?style=flat-square&logo=python&logoColor=fff)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini%20Flash-4285F4?style=flat-square&logo=google)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=fff)

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+, Python 3.11+
- A [Pinecone](https://www.pinecone.io/) account and index
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini Flash)
- PostgreSQL database (local or Supabase)

### 1. Clone the repo

```bash
git clone https://github.com/pratham7711/docmind-ai.git
cd docmind-ai
```

### 2. Set up the FastAPI backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in your keys
uvicorn app.main:app --reload --port 8000
```

**Backend `.env` keys:**

```env
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=your_index
GOOGLE_API_KEY=your_gemini_key
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
SECRET_KEY=your_jwt_secret
```

### 3. Set up the Next.js frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

**Frontend `.env.local` keys:**

```env
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
docmind-ai/
├── frontend/          # Next.js 14 App Router
│   └── src/app/       # Pages, components, API routes
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── routers/   # /upload, /chat, /auth endpoints
│   │   └── services/  # RAG pipeline, Pinecone, Gemini
│   └── alembic/       # DB migrations
└── docker-compose.yml # Full-stack local dev
```

---

## 🐳 Docker (optional)

```bash
docker-compose up --build
```

Spins up FastAPI + PostgreSQL together. Frontend still runs separately via `npm run dev`.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Built by <a href="https://github.com/pratham7711">Pratham</a> · Powered by Gemini Flash + Pinecone</p>
