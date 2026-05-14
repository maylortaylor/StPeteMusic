// ── Imports of actual repo .md files ─────────────────────────────────────────
// Webpack asset/source bundles these at build time — no fs calls at runtime.
// Path from: apps/admin/src/app/dashboard/playbook/ → repo root = ../../../../../../
import brandMd from '../../../../../../.claude/brand.md';
import eventsMd from '../../../../../../.claude/events.md';
import n8nMd from '../../../../../../.claude/n8n.md';
import brandVoiceMd from '../../../../../../.agents/context/brand-voice.md';
import n8nMainMd from '../../../../../../n8n/CLAUDE.md';
import newsletterPromptMd from '../../../../../../n8n/workflows/StPeteMusic/newsletter-system-prompt.md';
import enrichmentPromptMd from '../../../../../../n8n/workflows/StPeteMusic/artist-enrichment-system-prompt.md';
import socialPromptMd from '../../../../../../n8n/workflows/StPeteMusic/system-prompt.md';

import { PlaybookClient } from './playbook-client';

// ── Markdown renderer ─────────────────────────────────────────────────────────
// Handles: headings, bold, inline code, links, bullet lists, numbered lists,
// fenced code blocks, horizontal rules, and YAML frontmatter stripping.

function stripFrontmatter(md: string): string {
  if (!md.startsWith('---')) return md;
  const end = md.indexOf('\n---', 3);
  return end === -1 ? md : md.slice(end + 4).trimStart();
}

function inlineFormat(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:no-underline">$1</a>');
}

function renderMd(raw: string): string {
  const lines = stripFrontmatter(raw).split('\n');
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
  const codeLines: string[] = [];

  const flushList = () => {
    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Fenced code block
    if (line.startsWith('```')) {
      if (!inCode) {
        flushList();
        inCode = true;
        codeLines.length = 0;
      } else {
        const escaped = codeLines.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html.push(`<pre class="my-2 overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono leading-relaxed">${escaped}</pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeLines.push(raw); continue; }

    // Headings
    if (line.startsWith('#### ')) {
      flushList();
      html.push(`<h4 class="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">${inlineFormat(line.slice(5))}</h4>`);
    } else if (line.startsWith('### ')) {
      flushList();
      html.push(`<h3 class="mt-5 text-sm font-semibold text-foreground">${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      flushList();
      html.push(`<h2 class="mt-6 border-b border-border pb-1 text-base font-semibold text-foreground">${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      flushList();
      html.push(`<h1 class="mt-6 text-lg font-bold text-foreground">${inlineFormat(line.slice(2))}</h1>`);
    // Horizontal rule
    } else if (line === '---' || line === '***' || line === '___') {
      flushList();
      html.push('<hr class="my-4 border-border" />');
    // Table rows
    } else if (line.startsWith('|')) {
      flushList();
      if (line.replace(/[\s|:-]/g, '') === '') continue; // separator row
      const cells = line.split('|').slice(1, -1).map((c) => inlineFormat(c.trim()));
      html.push(`<div class="flex gap-4 text-sm py-0.5">${cells.map((c) => `<span class="min-w-0 flex-1">${c}</span>`).join('')}</div>`);
    // Bullet list
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inUl) { flushList(); html.push('<ul class="my-1 space-y-0.5 pl-4">'); inUl = true; }
      html.push(`<li class="text-sm text-muted-foreground list-disc">${inlineFormat(line.slice(2))}</li>`);
    // Numbered list
    } else if (/^\d+\.\s/.test(line)) {
      if (!inOl) { flushList(); html.push('<ol class="my-1 space-y-0.5 pl-4 list-decimal">'); inOl = true; }
      html.push(`<li class="text-sm text-muted-foreground">${inlineFormat(line.replace(/^\d+\.\s/, ''))}</li>`);
    // Blank line
    } else if (line === '') {
      flushList();
      html.push('<div class="h-2" />');
    // Normal paragraph
    } else {
      flushList();
      html.push(`<p class="text-sm text-muted-foreground leading-relaxed">${inlineFormat(line)}</p>`);
    }
  }
  flushList();
  return html.join('\n');
}

// ── Doc registry ──────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    heading: 'Brand & Events',
    docs: [
      { id: 'brand',       title: 'Brand Reference',             subtitle: 'Team, social accounts, Google account',        content: brandMd },
      { id: 'events',      title: 'Events & Content Guide',      subtitle: 'Final Friday, Instant Noodles, Art Walk',      content: eventsMd },
      { id: 'brand-voice', title: 'Brand Voice Guidelines',      subtitle: 'Tone, platform formatting, post structure',     content: brandVoiceMd },
    ],
  },
  {
    heading: 'n8n Workflows',
    docs: [
      { id: 'n8n',      title: 'n8n Quick Reference',        subtitle: 'Active workflows, triggers, AI config',        content: n8nMd },
      { id: 'n8n-main', title: 'n8n Technical Reference',    subtitle: 'Local dev, credentials, OAuth, editing rules', content: n8nMainMd },
    ],
  },
  {
    heading: 'AI System Prompts',
    docs: [
      { id: 'newsletter-prompt',  title: 'Newsletter System Prompt',        subtitle: 'Claude instructions for newsletter drafts',  content: newsletterPromptMd },
      { id: 'enrichment-prompt',  title: 'Artist Enrichment System Prompt', subtitle: 'Claude instructions for artist enrichment',  content: enrichmentPromptMd },
      { id: 'social-prompt',      title: 'Social Posting System Prompt',    subtitle: 'Claude instructions for Obsidian posts',    content: socialPromptMd },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlaybookPage() {
  const sections = SECTIONS.map((s) => ({
    heading: s.heading,
    docs: s.docs.map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: d.subtitle,
      html: renderMd(d.content),
    })),
  }));

  return <PlaybookClient sections={sections} />;
}
