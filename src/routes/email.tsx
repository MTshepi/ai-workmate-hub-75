import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  CopyButton,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Panel,
  PromptPeek,
  Segmented,
  StatusLine,
  ToolPage,
  Workbench,
} from "@/components/tool-page";
import { TONES, generateEmail, type EmailOutput, type Tone } from "@/lib/ai.functions";
import { logActivity } from "@/lib/activity";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Workplace Productivity Assistant" },
      { name: "description", content: "Generate formal, friendly or persuasive workplace emails from a short brief." },
      { property: "og:title", content: "Smart Email Generator" },
      { property: "og:description", content: "Draft professional emails in three tones, then edit and copy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const LENGTHS = ["Short", "Medium", "Detailed"] as const;

const SAMPLE = {
  recipient: "Daniel Okafor · Procurement Lead",
  purpose:
    "Request a revised quote for the Q3 server renewal. Reference our current contract (ref. VN-2291), ask for updated pricing on the 24-node tier, and confirm whether the early-renewal discount still applies if we sign before 30 September.",
};

function EmailPage() {
  const settings = useSettings();
  const [recipient, setRecipient] = useState(SAMPLE.recipient);
  const [purpose, setPurpose] = useState(SAMPLE.purpose);
  const [tone, setTone] = useState<Tone>(settings.defaultTone);
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("Medium");
  const [draft, setDraft] = useState<EmailOutput | null>(null);
  const [prompt, setPrompt] = useState("");

  const run = useServerFn(generateEmail);
  const mutation = useMutation({
    mutationFn: () => run({ data: { recipient, purpose, tone, senderName: settings.displayName, length } }),
    onSuccess: (res) => {
      setDraft(res.output);
      setPrompt(res.prompt);
      logActivity({ tool: "email", title: "Email draft", detail: `${tone} · to ${recipient || "unnamed"}` });
    },
  });

  const canRun = purpose.trim().length > 0 && !mutation.isPending;
  const fullText = draft ? `Subject: ${draft.subject}\n\n${draft.body}` : "";

  return (
    <ToolPage
      label="Tool 01 · Email"
      title="Smart Email Generator"
      description="Describe what you need to say; get a ready-to-send draft in the tone you choose. Edit the result before you copy it."
    >
      <Workbench>
        <Panel step="(a) Input" title="Compose a message" meta="Email · Gen">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canRun) mutation.mutate();
            }}
          >
            <Field label="Recipient" hint="optional">
              <input
                className="field"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Name · role"
              />
            </Field>
            <Field label="Purpose & key points" hint={`${purpose.length} chars`}>
              <textarea
                className="field resize-none"
                rows={5}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What should this email achieve? Include any facts, dates or asks."
                required
              />
            </Field>
            <Field label="Tone">
              <Segmented options={TONES} value={tone} onChange={setTone} />
            </Field>
            <Field label="Length">
              <Segmented options={LENGTHS} value={length} onChange={setLength} />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={!canRun}>
              {mutation.isPending ? "Generating…" : draft ? "Regenerate draft" : "Generate draft"}
            </button>
          </form>
        </Panel>

        <Panel
          step="(b) Output"
          title="Generated draft"
          delay={180}
          actions={
            <div className="flex items-center gap-1.5">
              <CopyButton text={fullText} />
              <button
                type="button"
                className="btn-ghost"
                disabled={!canRun || !draft}
                onClick={() => mutation.mutate()}
              >
                Regenerate
              </button>
            </div>
          }
        >
          {mutation.isPending ? (
            <LoadingState label={`Drafting a ${tone.toLowerCase()} email…`} />
          ) : mutation.isError ? (
            <ErrorState message={mutation.error.message} onRetry={() => mutation.mutate()} />
          ) : draft ? (
            <>
              <div className="flex flex-1 flex-col gap-3 rounded-xl bg-background/30 p-4 ring-1 ring-border">
                <Field label="Subject">
                  <input
                    className="field font-medium"
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  />
                </Field>
                <Field label="Body" hint="editable">
                  <textarea
                    className="field min-h-72 resize-y leading-relaxed"
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </Field>
              </div>
              <StatusLine>
                Draft ready · tone {tone.toLowerCase()} · {draft.body.split(/\s+/).filter(Boolean).length} words
                {mutation.data ? ` · ${(mutation.data.ms / 1000).toFixed(1)}s` : ""}
              </StatusLine>
              {settings.showPrompts && prompt ? <PromptPeek prompt={prompt} /> : null}
            </>
          ) : (
            <EmptyState
              title="No draft yet"
              hint="Fill in the purpose, pick a tone and press Generate. The subject and body will appear here, ready to edit."
            />
          )}
        </Panel>
      </Workbench>
    </ToolPage>
  );
}
