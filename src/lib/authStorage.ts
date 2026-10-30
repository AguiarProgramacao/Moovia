import type { SupportedStorage } from "@supabase/supabase-js";

const memory = new Map<string, string>();
// Tokens belong to localStorage only when the user chooses to remember the session.
// Credentials are handled exclusively by Supabase Auth and are never stored here.
export const authStorage: SupportedStorage = {
  getItem(key) {
    for (const kind of ["localStorage", "sessionStorage"] as const) {
      try {
        const value = window[kind].getItem(key);
        if (value !== null) return value;
      } catch {
        /* Try the next storage. */
      }
    }
    return memory.get(key) ?? null;
  },
  setItem(key, value) {
    let remember = false;
    try {
      remember = localStorage.getItem("movvia-remember") === "true";
    } catch {
      /* Session only. */
    }
    const target = remember ? "localStorage" : "sessionStorage";
    const other = remember ? "sessionStorage" : "localStorage";
    try {
      window[other].removeItem(key);
    } catch {
      /* Storage can be unavailable. */
    }
    try {
      window[target].setItem(key, value);
      memory.delete(key);
    } catch {
      memory.set(key, value);
    }
  },
  removeItem(key) {
    for (const kind of ["localStorage", "sessionStorage"] as const) {
      try {
        window[kind].removeItem(key);
      } catch {
        /* Still clear other storage. */
      }
    }
    memory.delete(key);
  },
};
