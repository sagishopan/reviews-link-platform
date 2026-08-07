import React, { useState } from 'react';

export default function InfoModal({ title, body }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className="absolute top-4 left-4 flex items-center justify-center rounded-full tap-target"
        style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' }}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16" />
          <circle cx="12" cy="8" r="0.6" fill="white" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-heading mb-2">{title}</h3>
            <p className="text-body text-[15px] leading-relaxed">{body}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full py-3 rounded-xl font-semibold text-white tap-target"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
