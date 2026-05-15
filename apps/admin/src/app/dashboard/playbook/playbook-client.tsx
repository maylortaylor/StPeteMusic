'use client';

import { useState, useEffect, useCallback } from 'react';

interface Doc {
  id: string;
  title: string;
  subtitle: string;
  html: string;
}

interface Section {
  heading: string;
  docs: Doc[];
}

interface Props {
  sections: Section[];
}

function DocModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col w-full max-w-6xl h-[95vh] rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border bg-muted/40 px-6 py-4 shrink-0 rounded-t-xl">
          <div>
            <p className="font-semibold text-foreground">{doc.title}</p>
            <p className="text-xs text-muted-foreground">{doc.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>
        {/* Scrollable content */}
        <div
          className="overflow-y-auto px-6 py-5"
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </div>
    </div>
  );
}

export function PlaybookClient({ sections }: Props) {
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const close = useCallback(() => setActiveDoc(null), []);

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Playbook</h1>
          <p className="mt-2 text-muted-foreground">
            Reference docs pulled directly from the repo — always up to date with the source files.
          </p>

          {/* Jump nav */}
          <div className="mt-4 flex flex-wrap gap-2">
            {sections.flatMap((s) => s.docs).map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.heading} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.docs.map((doc) => (
                <button
                  key={doc.id}
                  id={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className="group text-left rounded-lg border border-border bg-card overflow-hidden scroll-mt-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="border-b border-border bg-muted/40 px-5 py-3">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.subtitle}</p>
                  </div>
                  {/* Preview — first ~120px, faded out */}
                  <div className="relative h-32 overflow-hidden px-5 py-4">
                    <div
                      className="pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: doc.html }}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                  </div>
                  <div className="border-t border-border/50 px-5 py-2.5 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
                    Read full doc →
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeDoc && <DocModal doc={activeDoc} onClose={close} />}
    </>
  );
}
