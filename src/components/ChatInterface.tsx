import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { DropZone } from './DropZone';
import { ModelSelector } from './ModelSelector';
import { chatWithDocument } from '../utils/aiChat';
import { AI_MODELS } from '../types';
import type { DocumentInfo, Message } from '../types';

interface ChatInterfaceProps {
  document: DocumentInfo;
  messages: Message[];
  onMessagesChange: (msgs: Message[]) => void;
  onChangeDocument: (doc: DocumentInfo) => void;
}

const SUGGESTED = [
  'Summarize this document',
  'What are the key points?',
  'List the main topics covered',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInterface({
  document,
  messages,
  onMessagesChange,
  onChangeDocument,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text = input.trim()) => {
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg, aiMsg];
    onMessagesChange(newMessages);
    setInput('');
    setIsLoading(true);
    setStreamingId(aiMsgId);

    try {
      let accumulated = '';
      await chatWithDocument(
        document.content,
        document.name,
        text,
        messages,
        selectedModel,
        (chunk) => {
          accumulated += chunk;
          onMessagesChange(
            newMessages.map((m) =>
              m.id === aiMsgId ? { ...m, content: accumulated } : m
            )
          );
        }
      );
    } catch {
      onMessagesChange(
        newMessages.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setStreamingId(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fileExt = document.name.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div
            style={{
              width: 32, height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--cyan) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>
            DocMind <span className="gradient-text">AI</span>
          </span>
        </div>

        {/* Document info card */}
        <div
          className="glass"
          style={{
            borderRadius: 'var(--radius)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: 36, height: 36,
                borderRadius: '8px',
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                className="truncate"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}
                title={document.name}
              >
                {document.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {fileExt} · {formatFileSize(document.size)}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(6,182,212,0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(6,182,212,0.12)',
            }}
          >
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Characters indexed
            </p>
            <p style={{ fontSize: '13px', color: 'var(--cyan)', fontWeight: 600 }}>
              {document.content.length.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Suggested questions */}
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Suggested
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    (e.target as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.35)';
                    (e.target as HTMLButtonElement).style.color = 'var(--text)';
                    (e.target as HTMLButtonElement).style.background = 'rgba(124,58,237,0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.target as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Model selector */}
        <ModelSelector selected={selectedModel} onChange={setSelectedModel} />

        {/* Change document */}
        <div style={{ marginTop: 'auto' }}>
          <AnimatePresence>
            {showDropZone ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <DropZone onDocumentLoaded={onChangeDocument} compact />
                <button
                  onClick={() => setShowDropZone(false)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: '12px', cursor: 'pointer', marginTop: '6px',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowDropZone(true)}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Change Document
              </button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ── CHAT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              Chat with <span className="gradient-text">{document.name}</span>
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {messages.filter(m => m.role === 'user').length} questions asked
            </p>
          </div>
          {/* Active model badge */}
          {(() => {
            const m = AI_MODELS.find((x) => x.id === selectedModel);
            if (!m) return null;
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: m.color,
                    display: 'inline-block',
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${m.color}88`,
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {m.name}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '16px',
                textAlign: 'center',
                padding: '40px',
              }}
            >
              <div
                style={{
                  width: 64, height: 64,
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 100%)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Ready to answer your questions
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px' }}>
                  Ask anything about <strong style={{ color: 'var(--purple-light)' }}>{document.name}</strong>.
                  Try one of the suggested questions or type your own.
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={msg.id === streamingId}
            />
          ))}

          {/* Typing indicator */}
          {isLoading && streamingId && messages.find(m => m.id === streamingId)?.content === '' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
            >
              <div
                className="glass"
                style={{
                  padding: '14px 18px',
                  borderRadius: '4px 18px 18px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '16px 24px 24px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '12px 12px 12px 16px',
              transition: 'border-color 0.2s',
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your document…"
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                lineHeight: '1.6',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                width: 36, height: 36,
                borderRadius: '10px',
                background:
                  !input.trim() || isLoading
                    ? 'rgba(124,58,237,0.2)'
                    : 'linear-gradient(135deg, var(--purple) 0%, #5B21B6 100%)',
                border: 'none',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: !input.trim() || isLoading ? 'none' : '0 4px 16px rgba(124,58,237,0.4)',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </motion.button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '8px', textAlign: 'center' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
