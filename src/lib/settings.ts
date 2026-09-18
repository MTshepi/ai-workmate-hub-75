import { createLocalStore } from "./local-store";
import type { Tone } from "./ai.functions";

export type Settings = {
  displayName: string;
  role: string;
  defaultTone: Tone;
  workStart: string;
  workEnd: string;
  showPrompts: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Amara Reyes",
  role: "Operations Lead",
  defaultTone: "Formal",
  workStart: "09:00",
  workEnd: "17:30",
  showPrompts: true,
};

export const settingsStore = createLocalStore<Settings>("awpa.settings", DEFAULT_SETTINGS);
export const useSettings = settingsStore.use;
