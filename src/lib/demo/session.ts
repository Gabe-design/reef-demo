"use client";

import { create } from "zustand";
import type { ID } from "./types";

// Demo sign-in. The real platform uses an OIDC provider for staff and
// Twilio Verify phone codes for customers (spec 8); here a choice is simply
// remembered in this browser.
export type SessionUser = { kind: "staff"; id: ID } | { kind: "customer"; id: ID };

const KEY = "reef-demo-session";

interface SessionStore {
  hydrated: boolean;
  user: SessionUser | null;
  hydrate: () => void;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
}

export const useSession = create<SessionStore>((set) => ({
  hydrated: false,
  user: null,
  hydrate: () => {
    let user: SessionUser | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) user = JSON.parse(raw) as SessionUser;
    } catch {}
    set({ user, hydrated: true });
  },
  signIn: (user) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {}
    set({ user });
  },
  signOut: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    set({ user: null });
  },
}));
