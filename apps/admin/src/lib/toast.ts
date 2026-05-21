import { toast as sonnerToast } from 'sonner';

export type ApiErrorDetail = {
  endpoint?: string;
  method?: string;
  status?: number;
  body?: unknown;
  stack?: string;
  [key: string]: unknown;
};

export type ToastEntry = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'default';
  message: string;
  description?: string;
  detail?: ApiErrorDetail;
  timestamp: number;
  read: boolean;
};

const STORAGE_KEY = 'spm-toast-history';
const MAX_ENTRIES = 50;
const TOAST_EVENT = 'spm-toast';

function readHistory(): ToastEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeHistory(entries: ToastEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(TOAST_EVENT));
}

function pushToHistory(entry: Omit<ToastEntry, 'id' | 'timestamp' | 'read'>): ToastEntry {
  const full: ToastEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    read: false,
  };
  const history = readHistory();
  writeHistory([full, ...history].slice(0, MAX_ENTRIES));
  return full;
}

export function getToastHistory(): ToastEntry[] {
  return readHistory();
}

export function clearToastHistory() {
  writeHistory([]);
}

export function markAllRead() {
  writeHistory(readHistory().map((e) => ({ ...e, read: true })));
}

export function copyNotificationToClipboard(entry: ToastEntry) {
  const payload: Record<string, unknown> = { type: entry.type, message: entry.message };
  if (entry.description) payload.description = entry.description;
  if (entry.detail) payload.detail = entry.detail;
  navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
}

export { TOAST_EVENT };

type SonnerOpts = Parameters<typeof sonnerToast.success>[1];

type ErrorOpts = SonnerOpts & {
  detail?: ApiErrorDetail;
};

export const toast = {
  success(message: string, opts?: SonnerOpts) {
    const entry = pushToHistory({ type: 'success', message, description: opts?.description as string | undefined });
    return sonnerToast.success(message, {
      ...opts,
      action: { label: 'Copy', onClick: () => copyNotificationToClipboard(entry) },
    });
  },

  error(message: string, opts?: ErrorOpts) {
    const { detail, ...rest } = opts ?? {};
    const entry = pushToHistory({ type: 'error', message, description: rest.description as string | undefined, detail });
    const autoDescription =
      !rest.description && detail?.status
        ? `${detail.method ?? 'GET'} ${detail.endpoint} → ${detail.status}`
        : (rest.description as string | undefined);
    return sonnerToast.error(message, {
      ...rest,
      description: autoDescription,
      action: { label: 'Copy', onClick: () => copyNotificationToClipboard(entry) },
    } as SonnerOpts);
  },

  info(message: string, opts?: SonnerOpts) {
    const entry = pushToHistory({ type: 'info', message, description: opts?.description as string | undefined });
    return sonnerToast.info(message, {
      ...opts,
      action: { label: 'Copy', onClick: () => copyNotificationToClipboard(entry) },
    });
  },

  warning(message: string, opts?: SonnerOpts) {
    const entry = pushToHistory({ type: 'warning', message, description: opts?.description as string | undefined });
    return sonnerToast.warning(message, {
      ...opts,
      action: { label: 'Copy', onClick: () => copyNotificationToClipboard(entry) },
    });
  },
};
