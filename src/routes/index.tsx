import { Link, createFileRoute } from "@tanstack/react-router";
import { Disclaimer } from "@/components/app-shell";
import { timeAgo, useActivity } from "@/lib/activity";
import { useSettings } from "@/lib/settings";
import { useThreads } from "@/lib/threads";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Your AI command center: draft emails, summarize meetings, plan tasks, research topics and chat.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Five connected AI tools for everyday workplace productivity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TOOLS = [
  { n: "01", to: "/email", name: "Smart Email Generator", desc: "Formal, friendly or persuasive drafts" },
  { n: "02", to: "/meetings", name: "Meeting Notes Summarizer", desc: "Decisions, action items & deadlines" },
  { n: "03", to: "/tasks", name: "AI Task Planner", desc: "Prioritise & schedule your week" },
  { n: "04", to: "/research", name: "AI Research Assistant", desc: "Distill topics into insights" },
  { n: "05", to: "/chat", name: "Workplace Chatbot", desc: "Ask anything about your work" },
] as const;

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Home() {
  const settings = useSettings();
  const activity = useActivity();
  const threads = useThreads();
  const now = useClock();
  const hour = now?.getHours() ?? 9;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = settings.displayName.split(" ")[0] ?? "";
  const stamp = now
    ? `${now.toLocaleDateString(undefined, { weekday: "long" })} · ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    : "—";

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-end justify-between gap-4 animate-rise">
        <div>
          <div className="eyebrow mb-1">{stamp}</div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI Workplace Productivity Assistant is ready. Pick a tool to start.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <div className="font-mono text-[11px] text-faint">Active tools</div>
          <div className="text-lg font-semibold text-primary">5 / 5</div>
        </div>
      </div>

      <Disclaimer />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5 ring-1 ring-border animate-rise [animation-delay:120ms] md:col-span-2">
          <div className="eyebrow mb-4">(a) Quick launch</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="glass-2 rounded-xl p-4 ring-1 ring-border transition-all hover:ring-primary/30"
              >
                <div className="mb-2 font-mono text-xs text-primary">{t.n}</div>
                <div className="mb-1 text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </Link>
            ))}
            <div className="rounded-xl p-4 ring-1 ring-border ring-dashed">
              <div className="mb-2 font-mono text-xs text-faint">How it works</div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                Every tool sends a structured prompt — Role, Context, Task, Requirements, Output format — and
                returns a verifiable result you can edit.
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 ring-1 ring-border animate-rise [animation-delay:200ms]">
          <div className="eyebrow mb-4">(b) Recent</div>
          {activity.length === 0 ? (
            <div className="rounded-xl bg-background/30 p-4 text-center ring-1 ring-border ring-dashed">
              <div className="text-sm font-medium">No activity yet</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Generated emails, summaries and plans will appear here.
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {activity.slice(0, 6).map((a) => (
                <div key={a.id}>
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-foreground">{a.title}</span>
                    <span className="font-mono text-[10px] text-faint">{timeAgo(a.at)}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{a.detail}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <div className="eyebrow mb-2">Chat threads</div>
            <div className="text-sm">
              <span className="text-lg font-semibold text-primary">{threads.length}</span>{" "}
              <span className="text-muted-foreground">saved in this browser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
