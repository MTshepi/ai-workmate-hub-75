import { Check, ChevronDown, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Disclaimer } from "@/components/app-shell";
import { Shimmer } from "@/components/ai-elements/shimmer";

export function ToolPage({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="animate-rise">
        <div className="eyebrow mb-1">{label}</div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <Disclaimer />
      {children}
    </div>
  );
}

export function Workbench({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

export function Panel({
  step,
  title,
  meta,
  actions,
  children,
  delay = 120,
  className = "",
}: {
  step: string;
  title: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <section
      className={`glass flex flex-col rounded-2xl p-5 ring-1 ring-border animate-rise ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">{step}</div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {actions ?? (meta ? <span className="font-mono text-[10px] text-faint">{meta}</span> : null)}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="font-mono text-[11px] text-muted-foreground">{label}</label>
        {hint ? <span className="font-mono text-[10px] text-faint">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  cols,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`chip ${value === o ? "chip-active" : ""}`}
          aria-pressed={value === o}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost inline-flex items-center gap-1.5"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

/* ---------- Output states ---------- */

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-background/30 p-8 text-center ring-1 ring-border ring-dashed">
      <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <span className="font-mono text-sm text-primary">→</span>
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 max-w-xs text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl bg-background/30 p-4 ring-1 ring-border" aria-busy="true">
      <Shimmer className="text-sm font-medium">{label}</Shimmer>
      <div className="space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-panel-2" />
        <div className="h-3 w-full animate-pulse rounded bg-panel-2" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-panel-2" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-panel-2" />
      </div>
      <div className="font-mono text-[10px] text-faint">Role · Context · Task · Requirements · Output format</div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center rounded-xl bg-destructive/5 p-8 text-center ring-1 ring-destructive/30"
    >
      <div className="mb-3 grid size-10 place-items-center rounded-xl bg-destructive/15 ring-1 ring-destructive/30">
        <span className="font-mono text-sm text-destructive">!</span>
      </div>
      <div className="text-sm font-medium">Couldn't complete this request</div>
      <div className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-ghost mt-4">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function StatusLine({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-faint">
      <span className="size-1.5 rounded-full bg-primary" />
      <span>{children}</span>
    </div>
  );
}

/** Collapsible view of the exact structured prompt that was sent. */
export function PromptPeek({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl ring-1 ring-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-faint hover:text-muted-foreground"
        aria-expanded={open}
      >
        Structured prompt used
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <pre className="max-h-72 overflow-auto border-t border-border px-3 py-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {prompt}
        </pre>
      ) : null}
    </div>
  );
}

export function Tag({ tone, children }: { tone: "High" | "Medium" | "Low" | "neutral"; children: ReactNode }) {
  const cls =
    tone === "High"
      ? "bg-destructive/15 text-destructive ring-destructive/30"
      : tone === "Medium"
        ? "bg-warning/15 text-warning ring-warning/30"
        : tone === "Low"
          ? "bg-success/15 text-success ring-success/30"
          : "bg-primary/10 text-primary ring-primary/25";
  return (
    <span className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] ring-1 ${cls}`}>
      {children}
    </span>
  );
}
