import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSettings } from "@/lib/settings";

export const NAV = [
  { to: "/", label: "Home", section: "workspace" },
  { to: "/email", label: "Smart Email", section: "workspace" },
  { to: "/meetings", label: "Meeting Notes", section: "workspace" },
  { to: "/tasks", label: "Task Planner", section: "workspace" },
  { to: "/research", label: "Research", section: "workspace" },
  { to: "/chat", label: "Chatbot", section: "workspace" },
  { to: "/settings", label: "Settings", section: "system" },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/email": "Smart Email Generator",
  "/meetings": "Meeting Notes Summarizer",
  "/tasks": "AI Task Planner",
  "/research": "AI Research Assistant",
  "/chat": "Workplace Chatbot",
  "/settings": "Settings",
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const render = (section: "workspace" | "system") =>
    NAV.filter((n) => n.section === section).map((n) => (
      <Link
        key={n.to}
        to={n.to}
        onClick={onNavigate}
        activeOptions={{ exact: n.to === "/" }}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        activeProps={{ className: "bg-primary/10 text-foreground ring-1 ring-primary/25" }}
      >
        {({ isActive }) => (
          <>
            <span className={`size-1.5 rounded-full ${isActive ? "bg-primary" : "bg-faint"}`} />
            {n.label}
          </>
        )}
      </Link>
    ));

  return (
    <>
      <div className="eyebrow mb-2 px-3">(a) Workspace</div>
      <nav className="space-y-1">{render("workspace")}</nav>
      <div className="eyebrow mt-6 mb-2 px-3">(b) System</div>
      <nav className="space-y-1">{render("system")}</nav>
    </>
  );
}

function Brand() {
  return (
    <div className="mb-6 flex items-center gap-2.5 px-2 py-2">
      <div className="grid size-8 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
        <span className="font-mono text-sm font-medium text-primary">V</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Vantage</div>
        <div className="eyebrow tracking-wider">AI Workplace Assistant</div>
      </div>
    </div>
  );
}

function StatusCard() {
  return (
    <div className="glass mt-auto rounded-xl p-3 ring-1 ring-border">
      <div className="mb-2 flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary animate-pulse-dot" />
        <span className="font-mono text-[11px] text-muted-foreground">System nominal</span>
      </div>
      <div className="font-mono text-[10px] leading-relaxed text-faint">5 tools online · Lovable AI</div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = "/" + (pathname.split("/")[1] ?? "");
  const title = PAGE_TITLES[base] ?? "Home";
  const settings = useSettings();
  const initials = settings.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-display text-foreground">
      <div className="pointer-events-none absolute -top-40 -left-32 size-[520px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 size-[480px] rounded-full bg-primary/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-[420px] rounded-full bg-primary/10 blur-[150px]" />

      <div className="relative flex">
        <aside className="glass-2 sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-4 md:flex">
          <Brand />
          <NavLinks />
          <StatusCard />
        </aside>

        <main className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border px-4 md:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="grid size-8 place-items-center rounded-lg ring-1 ring-border text-muted-foreground md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="glass-2 w-64 border-border p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-full flex-col">
                  <Brand />
                  <NavLinks onNavigate={() => setOpen(false)} />
                  <StatusCard />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <span className="hidden text-faint sm:inline">Vantage</span>
              <span className="hidden text-faint sm:inline">/</span>
              <span className="truncate">{title}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="glass-2 hidden items-center gap-2 rounded-lg px-3 py-1.5 ring-1 ring-border sm:flex">
                <span className="font-mono text-xs text-faint">AI</span>
                <span className="text-xs text-muted-foreground">Verify outputs</span>
              </span>
              <Link
                to="/settings"
                aria-label="Settings"
                className="grid size-8 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary ring-1 ring-primary/30"
              >
                {initials || "?"}
              </Link>
            </div>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="flex items-center gap-2 font-mono text-[10px] text-faint">
        <span className="text-primary">!</span>
        Responsible AI · outputs may contain errors — verify before use
      </p>
    );
  }
  return (
    <div
      role="note"
      className="glass flex items-start gap-3 rounded-xl px-4 py-3 ring-1 ring-primary/25 animate-rise [animation-delay:60ms]"
    >
      <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
        <span className="font-mono text-xs text-primary">!</span>
      </div>
      <div className="text-sm leading-relaxed">
        <span className="font-medium text-foreground">Responsible AI notice. </span>
        <span className="text-muted-foreground">
          Outputs are machine-generated and may contain errors, omissions or bias. Always review and verify
          before you send, share or act on them.
        </span>
      </div>
    </div>
  );
}
