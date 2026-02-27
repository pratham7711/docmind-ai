import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { extractTextFromFile } from '../utils/pdfExtractor';
import type { DocumentInfo } from '../types';

interface DropZoneProps {
  onDocumentLoaded: (doc: DocumentInfo) => void;
  compact?: boolean;
}

export function DropZone({ onDocumentLoaded, compact = false }: DropZoneProps) {
  const [progress, setProgress] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setFileName(file.name);
      setExtracting(true);
      setProgress(20);

      try {
        const progressInterval = setInterval(() => {
          setProgress((p) => Math.min(p + 15, 85));
        }, 300);

        const content = await extractTextFromFile(file);
        clearInterval(progressInterval);
        setProgress(100);

        if (content.startsWith('Unsupported file type')) {
          setError(content);
          setExtracting(false);
          setProgress(0);
          return;
        }

        setTimeout(() => {
          onDocumentLoaded({
            name: file.name,
            size: file.size,
            type: file.type || `text/${file.name.split('.').pop()}`,
            content,
            uploadedAt: new Date(),
          });
          setExtracting(false);
        }, 400);
      } catch (err) {
        setError('Failed to extract text from file. Please try again.');
        setExtracting(false);
        setProgress(0);
      }
    },
    [onDocumentLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    disabled: extracting,
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        style={{
          padding: '12px 20px',
          minHeight: '44px',
          borderRadius: 'var(--radius)',
          border: `1px dashed ${isDragActive ? 'var(--purple)' : 'var(--border)'}`,
          background: isDragActive ? 'rgba(124,58,237,0.06)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}
      >
        <input {...getInputProps()} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>Change document</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        {...getRootProps()}
        style={{
          position: 'relative',
          padding: 'clamp(28px, 5vw, 40px) clamp(20px, 4vw, 32px)',
          borderRadius: 'var(--radius-lg)',
          border: `2px dashed ${
            isDragActive ? 'var(--purple)' : error ? 'var(--danger)' : 'rgba(124,58,237,0.3)'
          }`,
          background: isDragActive
            ? 'rgba(124,58,237,0.06)'
            : 'rgba(255,255,255,0.02)',
          cursor: extracting ? 'default' : 'pointer',
          transition: 'all 0.25s ease',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <input {...getInputProps()} />

        {/* Glow effect when dragging */}
        {isDragActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {extracting ? (
            <motion.div
              key="extracting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            >
              <div style={{
                width: 48, height: 48,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--purple)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div>
                <p style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                  Extracting text from <strong>{fileName}</strong>
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Processing your document...
                </p>
              </div>
              <div style={{
                width: '100%', maxWidth: '280px',
                height: '4px',
                background: 'var(--surface2)',
                borderRadius: '99px',
                overflow: 'hidden',
              }}>
                <div
                  className="progress-bar-fill"
                  style={{ height: '100%', width: `${progress}%`, borderRadius: '99px' }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            >
              {/* Upload icon */}
              <motion.div
                animate={isDragActive ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  width: 56, height: 56,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 100%)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </motion.div>

              <div>
                <p style={{ fontSize: '16px', color: 'var(--text)', marginBottom: '6px', fontWeight: 500 }}>
                  {isDragActive ? 'Drop it here!' : 'Drop your file here or click to upload'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Supports PDF, TXT, and Markdown files
                </p>
              </div>

              {/* Format badges */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['PDF', 'TXT', 'MD'].map((fmt) => (
                  <span
                    key={fmt}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      background: 'rgba(124,58,237,0.12)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: 'var(--purple-light)',
                    }}
                  >
                    {fmt}
                  </span>
                ))}
              </div>

              {error && (
                <p style={{ fontSize: '13px', color: 'var(--danger)', textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
