import { useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingHero } from './components/LandingHero';
// ChatInterface (+ AI SDK, react-markdown) is only needed once a document is
// uploaded — lazy-load it so the landing experience is as fast as possible.
const ChatInterface = lazy(() =>
  import('./components/ChatInterface').then((m) => ({ default: m.ChatInterface }))
);
import type { DocumentInfo, Message } from './types';
import './index.css';

/** Skeleton shown while the ChatInterface chunk downloads */
function ChatSkeleton() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      {/* Top bar skeleton */}
      <div
        style={{
          height: 56,
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 6, marginLeft: 'auto' }} />
      </div>

      {/* Message area skeleton */}
      <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[{ w: '60%', align: 'flex-end' }, { w: '75%', align: 'flex-start' }, { w: '50%', align: 'flex-end' }].map(
          (item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: item.align as 'flex-start' | 'flex-end' }}>
              <div className="skeleton" style={{ width: item.w, height: 48, borderRadius: 12 }} />
            </div>
          )
        )}
      </div>

      {/* Input area skeleton */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="skeleton" style={{ height: 52, borderRadius: 12 }} />
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 400% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleDocumentLoaded = (doc: DocumentInfo) => {
    setDocument(doc);
    setMessages([]);
  };

  return (
    <>
      {/* Animated background orbs */}
      <div className="bg-orbs" />

      <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {!document ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              <LandingHero onDocumentLoaded={handleDocumentLoaded} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%' }}
            >
              <Suspense fallback={<ChatSkeleton />}>
                <ChatInterface
                  document={document}
                  messages={messages}
                  onMessagesChange={setMessages}
                  onChangeDocument={handleDocumentLoaded}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
