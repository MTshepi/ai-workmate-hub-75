import type { UIMessage } from "ai";
import { createLocalStore, uid } from "./local-store";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

export const threadsStore = createLocalStore<Thread[]>("awpa.threads", []);
export const useThreads = threadsStore.use;

export function createThread(): Thread {
  const thread: Thread = { id: uid(), title: "New conversation", updatedAt: Date.now(), messages: [] };
  threadsStore.update((prev) => [thread, ...prev]);
  return thread;
}

/** Idempotent: returns the newest thread, creating one only when none exist. */
export function ensureThread(): Thread {
  const existing = threadsStore.get();
  if (existing.length > 0) return existing[0]!;
  return createThread();
}

export function getThread(id: string) {
  return threadsStore.get().find((t) => t.id === id);
}

export function saveThreadMessages(id: string, messages: UIMessage[]) {
  threadsStore.update((prev) =>
    prev
      .map((t) => {
        if (t.id !== id) return t;
        const firstUser = messages.find((m) => m.role === "user");
        const text = firstUser?.parts
          .map((p) => (p.type === "text" ? p.text : ""))
          .join("")
          .trim();
        const title = text ? text.slice(0, 48) + (text.length > 48 ? "…" : "") : t.title;
        return { ...t, title, messages, updatedAt: Date.now() };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

export function deleteThread(id: string) {
  threadsStore.update((prev) => prev.filter((t) => t.id !== id));
}
