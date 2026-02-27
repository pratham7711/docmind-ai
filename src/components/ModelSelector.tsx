import { useEffect, useRef, useState } from 'react';
import { AI_MODELS, type AIModel, type AIProvider } from '../types';

interface ModelSelectorProps {
  selected: string;
  onChange: (modelId: string) => void;
}

const PROVIDER_ORDER: AIProvider[] = ['gemini', 'mistral', 'groq'];

const PROVIDER_META: Record<AIProvider, { label: string; color: string; bg: string; border: string }> = {
  gemini: {
    label: 'Google',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  mistral: {
    label: 'Mistral',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
  },
  groq: {
    label: 'Groq',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.2)',
  },
};

export function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeModel: AIModel =
    AI_MODELS.find((m) => m.id === selected) ?? AI_MODELS[0];
  const activeMeta = PROVIDER_META[activeModel.provider];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const grouped = PROVIDER_ORDER.map((p) => ({
    provider: p,
    meta: PROVIDER_META[p],
    models: AI_MODELS.filter((m) => m.provider === p),
  }));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Label */}
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        AI Model
      </p>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${open ? activeMeta.color + '55' : 'var(--border)'}`,
          borderRadius: '10px',
          padding: '9px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = activeMeta.color + '55';
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Provider badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: activeMeta.bg,
              color: activeMeta.color,
              border: `1px solid ${activeMeta.border}`,
              flexShrink: 0,
            }}
          >
            {activeMeta.label.toUpperCase()}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
            {activeModel.name}
          </span>
        </div>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2.5"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#16162a',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            padding: '6px',
          }}
        >
          {grouped.map(({ provider, meta, models }) => (
            <div key={provider}>
              {/* Provider group header */}
              <p
                style={{
                  fontSize: '10px',
                  color: meta.color,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '6px 8px 4px',
                  opacity: 0.8,
                }}
              >
                {meta.label}
              </p>

              {models.map((m) => {
                const isActive = m.id === selected;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    style={{
                      width: '100%',
                      background: isActive ? meta.bg : 'transparent',
                      border: `1px solid ${isActive ? meta.border : 'transparent'}`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      marginBottom: '2px',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(255,255,255,0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isActive ? meta.color : 'var(--text)',
                          textAlign: 'left',
                          marginBottom: '1px',
                        }}
                      >
                        {m.name}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'left' }}>
                        {m.description}
                      </p>
                    </div>

                    {isActive && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={meta.color}
                        strokeWidth="2.5"
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
