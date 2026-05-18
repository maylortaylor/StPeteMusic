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

export function copyErrorToClipboard(entry: ToastEntry) {
  navigator.clipboard.writeText(
    JSON.stringify(entry.detail ?? { message: entry.message }, null, 2),
  );
}

export { TOAST_EVENT };

type SonnerOpts = Parameters<typeof sonnerToast.success>[1];

type ErrorOpts = SonnerOpts & {
  detail?: ApiErrorDetail;
};

export const toast = {
  success(message: string, opts?: SonnerOpts) {
    pushToHistory({ type: 'success', message });
    return sonnerToast.success(message, opts);
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
      action: detail
        ? { label: 'Copy error', onClick: () => copyErrorToClipboard(entry) }
        : (rest as { action?: unknown }).action,
    } as SonnerOpts);
  },

  info(message: string, opts?: SonnerOpts) {
    pushToHistory({ type: 'info', message });
    return sonnerToast.info(message, opts);
  },

  warning(message: string, opts?: SonnerOpts) {
    pushToHistory({ type: 'warning', message });
    return sonnerToast.warning(message, opts);
  },
};
