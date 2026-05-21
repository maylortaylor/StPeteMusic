'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, Clock, Clipboard, Trash2 } from 'lucide-react';
import {
  type ToastEntry,
  clearToastHistory,
  copyNotificationToClipboard,
  getToastHistory,
  markAllRead,
  TOAST_EVENT,
} from '@/lib/toast';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const TYPE_ICON: Record<ToastEntry['type'], React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />,
  error: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
  info: <Info className="h-4 w-4 shrink-0 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />,
  default: <Info className="h-4 w-4 shrink-0 text-muted-foreground" />,
};

export function ToastHistoryPopover() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ToastEntry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => setHistory(getToastHistory());

  useEffect(() => {
    refresh();
    window.addEventListener(TOAST_EVENT, refresh);
    return () => window.removeEventListener(TOAST_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const unread = history.filter((e) => !e.read).length;

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      markAllRead();
      setHistory((h) => h.map((e) => ({ ...e, read: true })));
    }
  }

  function handleClear() {
    clearToastHistory();
    setHistory([]);
  }

  function handleCopy(entry: ToastEntry) {
    copyNotificationToClipboard(entry);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Toast history"
      >
        <Clock className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold text-foreground">Notification history</span>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Clear history"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
            ) : (
              <ul>
                {history.slice(0, 20).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-1 border-b border-border/50 px-3 py-2 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      {TYPE_ICON[entry.type]}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-foreground">{entry.message}</p>
                        {entry.description && !entry.detail && (
                          <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                        )}
                        {entry.detail && (
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.detail.method ?? 'GET'} {entry.detail.endpoint}
                            {entry.detail.status ? ` → ${entry.detail.status}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => handleCopy(entry)}
                          title="Copy notification"
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Clipboard className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-muted-foreground">{relativeTime(entry.timestamp)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
