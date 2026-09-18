import { createLocalStore, uid } from "./local-store";

export type ToolId = "email" | "meetings" | "tasks" | "research" | "chat";

export type Activity = {
  id: string;
  tool: ToolId;
  title: string;
  detail: string;
  at: number;
};

export const activityStore = createLocalStore<Activity[]>("awpa.activity", []);
export const useActivity = activityStore.use;

export function logActivity(entry: Omit<Activity, "id" | "at">) {
  activityStore.update((prev) => [{ ...entry, id: uid(), at: Date.now() }, ...prev].slice(0, 25));
}

export function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
