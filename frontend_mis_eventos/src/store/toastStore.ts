import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string, ms?: number) => useToastStore.getState().push(msg, 'success', ms),
  error:   (msg: string, ms?: number) => useToastStore.getState().push(msg, 'error',   ms),
  info:    (msg: string, ms?: number) => useToastStore.getState().push(msg, 'info',    ms),
  warning: (msg: string, ms?: number) => useToastStore.getState().push(msg, 'warning', ms),
};
