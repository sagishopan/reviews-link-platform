import React, { useState, useEffect } from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import privacyPolicyMeta from '../../content/privacy-policy.meta.json';
import privacyPolicyContent from '../../content/privacy-policy.he.md?raw';

export default function PrivacyPolicyPage() {
  const { t } = useI18n();
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    setMarkdown(privacyPolicyContent);
  }, []);

  const parseMarkdown = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} style={{ fontSize: 28, fontWeight: 900, marginTop: 24, marginBottom: 16 }}>
            {line.replace(/^# /, '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} style={{ fontSize: 20, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>
            {line.replace(/^## /, '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} style={{ fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 10 }}>
            {line.replace(/^### /, '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={`li-${i}`} style={{ marginBottom: 8, paddingRight: 16 }}>
            {line.replace(/^- /, '')}
          </li>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        const text = line.replace(/\*\*/g, '');
        elements.push(
          <p key={`bold-${i}`} style={{ fontWeight: 600, marginBottom: 8 }}>
            {text}
          </p>
        );
      } else if (line.startsWith('```')) {
        // Code block - collect until closing ```
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              backgroundColor: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
              overflow: 'auto',
              marginBottom: 12,
              fontSize: 13,
              fontFamily: 'monospace',
              direction: 'ltr',
              textAlign: 'left'
            }}
          >
            {codeLines.join('\n')}
          </pre>
        );
      } else if (line === '---') {
        elements.push(
          <hr key={`hr-${i}`} style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        );
      } else if (line.trim()) {
        elements.push(
          <p key={`p-${i}`} style={{ marginBottom: 12, lineHeight: 1.7 }}>
            {line}
          </p>
        );
      } else if (line === '' && i > 0) {
        // Check if next line is a list item
        if (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
          elements.push(
            <ul key={`ul-${i}`} style={{ paddingRight: 24, marginBottom: 12 }}>
              {(() => {
                const listItems = [];
                let j = i + 1;
                while (j < lines.length && lines[j].startsWith('- ')) {
                  listItems.push(
                    <li key={`item-${j}`} style={{ marginBottom: 8, paddingRight: 16 }}>
                      {lines[j].replace(/^- /, '')}
                    </li>
                  );
                  j++;
                }
                i = j - 1;
                return listItems;
              })()}
            </ul>
          );
        }
      }

      i++;
    }

    return elements;
  };

  return (
    <Screen
      className="min-h-screen bg-white"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: '#0066cc',
            padding: 0,
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          {t.common.back || 'חזור'}
        </button>

        {/* Updated date */}
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
          {t.common.last_updated || 'עדכון אחרון'}: {privacyPolicyMeta.updatedAt}
        </p>

        {/* Content */}
        <div style={{ direction: 'rtl', textAlign: 'right', fontSize: 16, lineHeight: 1.7, color: '#333' }}>
          {parseMarkdown(markdown)}
        </div>
      </div>
    </Screen>
  );
}
