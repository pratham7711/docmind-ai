import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { DropZone } from './DropZone';
import type { DocumentInfo } from '../types';

interface LandingHeroProps {
  onDocumentLoaded: (doc: DocumentInfo) => void;
}

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Instant Answers',
    desc: 'Get responses in seconds',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Source Aware',
    desc: 'Cites your document directly',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Context Rich',
    desc: 'Full document understanding',
  },
];

export function LandingHero({ onDocumentLoaded }: LandingHeroProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered entrance
      gsap.from('.hero-line', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power4.out',
        delay: 0.1,
      });

      gsap.from(subtitleRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.5,
      });

      gsap.from('.feature-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.7,
      });

      gsap.from('.drop-zone-wrapper', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.45,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      className="landing-hero"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)',
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
        gap: '0',
      }}
    >
      {/* Tagline chip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 14px',
          borderRadius: '99px',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.25)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--purple-light)',
          marginBottom: '28px',
          letterSpacing: '0.02em',
        }}
      >
        <span
          style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'var(--cyan)',
            boxShadow: '0 0 8px var(--cyan)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.8); }
          }
        `}</style>
        AI-Powered Document Chat
      </motion.div>

      {/* Title */}
      <div ref={titleRef} style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          className="hero-line"
          style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--text)',
          }}
        >
          Talk to Your
        </div>
        <div
          className="hero-line gradient-text"
          style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          Documents
        </div>
      </div>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: '480px',
          lineHeight: 1.6,
          marginBottom: '40px',
        }}
      >
        Drop any PDF or text file. Ask anything.
        <br />
        Get instant answers powered by AI.
      </p>

      {/* Drop zone */}
      <div
        className="drop-zone-wrapper"
        style={{ width: '100%', maxWidth: '520px', marginBottom: '40px' }}
      >
        <DropZone onDocumentLoaded={onDocumentLoaded} />
      </div>

      {/* Feature cards */}
      <div
        ref={featuresRef}
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            className="feature-card glass"
            whileHover={{ y: -4, borderColor: 'rgba(124,58,237,0.3)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: 36, height: 36,
                borderRadius: '9px',
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {f.icon}
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '1px' }}>
                {f.title}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
