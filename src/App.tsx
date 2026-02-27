import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingHero } from './components/LandingHero';
import { ChatInterface } from './components/ChatInterface';
import type { DocumentInfo, Message } from './types';
import './index.css';

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
              <ChatInterface
                document={document}
                messages={messages}
                onMessagesChange={setMessages}
                onChangeDocument={handleDocumentLoaded}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
