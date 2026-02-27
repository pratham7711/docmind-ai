import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '6px',
      }}
    >
      {/* Role label */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          paddingLeft: isUser ? 0 : '4px',
          paddingRight: isUser ? '4px' : 0,
        }}
      >
        {isUser ? 'You' : 'DocMind AI'}
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: '80%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Bubble */}
        <div
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, var(--purple) 0%, #5B21B6 100%)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
                }
              : {
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '14px 18px',
                  borderRadius: '4px 18px 18px 18px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
                  position: 'relative' as const,
                }
          }
        >
          {isUser ? (
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{message.content}</p>
          ) : (
            <div className="markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {isStreaming && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '14px',
                    background: 'var(--purple-light)',
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                    animation: 'cursor-blink 0.8s step-end infinite',
                  }}
                />
              )}
              <style>{`
                @keyframes cursor-blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
              `}</style>
            </div>
          )}

          {/* Copy button — AI messages only */}
          {!isUser && !isStreaming && message.content && (
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                borderRadius: '6px',
                padding: '4px 6px',
                cursor: 'pointer',
                color: copied ? 'var(--success)' : 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: 'var(--font)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s',
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </motion.button>
          )}
        </div>

        {/* Timestamp */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-subtle)',
            paddingLeft: isUser ? 0 : '4px',
            paddingRight: isUser ? '4px' : 0,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {timeStr}
        </div>
      </div>
    </motion.div>
  );
}
