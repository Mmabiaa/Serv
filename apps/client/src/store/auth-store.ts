import { useSyncExternalStore } from "react";

export type Role = "manager" | "cashier";

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  initials: string;
  token?: string;
};

const KEY = "kigali_pos_session";

function read(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

let current: SessionUser | null = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const authStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get() {
    return current;
  },
  login(user: SessionUser) {
    current = user;
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      /* noop */
    }
    emit();
  },
  logout() {
    current = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    emit();
  },
};

export function useAuth() {
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.get,
    () => null,
  );
}
