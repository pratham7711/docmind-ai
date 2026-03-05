import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] font-bold text-sm">
            D
          </div>
          <span className="font-semibold text-white/90 tracking-tight">DocMind AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Powered by Gemini + Pinecone
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6 max-w-4xl">
          <span className="text-white">Ask anything about</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">
            your documents
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed">
          Upload a PDF. Ask questions. Get cited answers — powered by AI.
          <br className="hidden md:block" />
          Every answer shows exactly which page it came from.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transform"
          >
            Get Started →
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all font-medium text-white/70 hover:text-white"
          >
            View Demo
          </Link>
        </div>

        {/* Hero card mockup */}
        <div className="mt-20 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl shadow-indigo-500/10">
          <div className="border-b border-white/5 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-white/30 font-mono">docmind.ai/chat/session_abc123</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-end">
              <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-indigo-600 text-sm max-w-xs text-left">
                What are the key findings in chapter 3?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 text-sm max-w-sm text-white/80 text-left">
                <p className="mb-2">Chapter 3 identifies three key findings:</p>
                <p className="text-white/60">1. Revenue increased 42% YoY driven by enterprise...</p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-indigo-300">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">Page 24</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">Page 31</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Everything you need</h2>
          <p className="text-white/40 text-center mb-12">
            No prompting skills required. Just upload and ask.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📄',
                title: 'Upload PDF',
                desc: 'Drag & drop any PDF. We handle parsing, chunking, and embedding automatically.',
              },
              {
                icon: '💬',
                title: 'Ask Questions',
                desc: 'Natural language queries — no prompting needed. Ask like you\'re talking to a colleague.',
              },
              {
                icon: '📍',
                title: 'Cited Answers',
                desc: 'Every answer shows which page it came from. Verify claims instantly, trust the output.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[#818cf8] transition-colors">
                  {f.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">How it works</h2>
          <p className="text-white/40 text-center mb-12">Three steps to smarter document reading.</p>
          <div className="relative flex flex-col md:flex-row items-start gap-8 md:gap-0">
            {[
              { step: '1', title: 'Upload your PDF', desc: 'Drop any PDF file. We process and index it in seconds using vector embeddings.' },
              { step: '2', title: 'Ask a question', desc: 'Type any question in plain English. No special syntax, no prompt engineering.' },
              { step: '3', title: 'Get cited answers', desc: 'Receive precise answers with page references. Click to jump to the exact source.' },
            ].map((item, i) => (
              <div key={item.step} className="flex-1 flex flex-col items-center text-center px-4 relative">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/50 bg-indigo-500/15 flex items-center justify-center text-[#818cf8] font-bold text-lg mb-4 z-10">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px border-t border-dashed border-indigo-500/30" />
                )}
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/40 mb-8">Upload your first PDF and ask your first question in under a minute.</p>
          <Link
            href="/login"
            className="inline-flex px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-white shadow-lg shadow-indigo-500/25"
          >
            Start for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6 text-center text-white/25 text-sm">
        DocMind AI — Built with FastAPI, Pinecone &amp; Gemini
      </footer>
    </div>
  )
}
