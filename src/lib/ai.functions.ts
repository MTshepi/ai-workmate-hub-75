import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

/* ---------- Shared input/output schemas (client-safe) ---------- */

export const TONES = ["Formal", "Friendly", "Persuasive"] as const;
export type Tone = (typeof TONES)[number];

const EmailInput = z.object({
  recipient: z.string(),
  purpose: z.string().min(1),
  tone: z.enum(TONES),
  senderName: z.string(),
  length: z.enum(["Short", "Medium", "Detailed"]),
});
export type EmailInput = z.infer<typeof EmailInput>;

const EmailOutput = z.object({ subject: z.string(), body: z.string() });
export type EmailOutput = z.infer<typeof EmailOutput>;

const MeetingInput = z.object({ notes: z.string().min(1), meetingTitle: z.string() });
export type MeetingInput = z.infer<typeof MeetingInput>;
const MeetingOutput = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(z.object({ task: z.string(), owner: z.string(), due: z.string() })),
  deadlines: z.array(z.object({ label: z.string(), date: z.string() })),
  openQuestions: z.array(z.string()),
});
export type MeetingOutput = z.infer<typeof MeetingOutput>;

const TaskInput = z.object({
  tasks: z.string().min(1),
  horizon: z.enum(["daily", "weekly"]),
  workStart: z.string(),
  workEnd: z.string(),
  focus: z.string(),
});
export type TaskInput = z.infer<typeof TaskInput>;
const TaskOutput = z.object({
  prioritized: z.array(
    z.object({
      task: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      reason: z.string(),
      estimate: z.string(),
    }),
  ),
  schedule: z.array(
    z.object({
      day: z.string(),
      blocks: z.array(z.object({ time: z.string(), task: z.string(), note: z.string() })),
    }),
  ),
  tips: z.array(z.string()),
});
export type TaskOutput = z.infer<typeof TaskOutput>;

const ResearchInput = z.object({
  topic: z.string().min(1),
  audience: z.string(),
  depth: z.enum(["Quick brief", "Standard", "Deep dive"]),
});
export type ResearchInput = z.infer<typeof ResearchInput>;
const ResearchOutput = z.object({
  title: z.string(),
  overview: z.string(),
  keyPoints: z.array(z.string()),
  insights: z.array(z.object({ insight: z.string(), why: z.string() })),
  recommendations: z.array(z.object({ action: z.string(), priority: z.enum(["High", "Medium", "Low"]) })),
  caveats: z.array(z.string()),
});
export type ResearchOutput = z.infer<typeof ResearchOutput>;

export type ToolResult<T> = { output: T; prompt: string; ms: number };

/* ---------- Shared runner (server only, imported lazily) ---------- */

async function runStructured<T>(schema: z.ZodType<T>, prompt: string): Promise<ToolResult<T>> {
  const { createLovableResponsesProvider, CHAT_MODEL, reasoningOptions, toFriendlyAiError } =
    await import("./ai-gateway.server");
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this workspace yet.");

  const started = Date.now();
  const { provider } = createLovableResponsesProvider(key);
  try {
    const result = streamText({
      model: provider.responses(CHAT_MODEL),
      output: Output.object({ schema }),
      prompt,
      providerOptions: reasoningOptions("low"),
      maxRetries: 0,
    });
    const output = await result.output;
    return { output, prompt, ms: Date.now() - started };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        const parsed = schema.parse(JSON.parse(error.text));
        return { output: parsed, prompt, ms: Date.now() - started };
      } catch {
        throw new Error("The AI returned an unexpected format. Please try again.");
      }
    }
    console.error("[ai] tool call failed", error);
    throw new Error(toFriendlyAiError(error).message);
  }
}

/* ---------- Server functions ---------- */

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const { emailPrompt, renderPrompt } = await import("./prompts.server");
    return runStructured(EmailOutput, renderPrompt(emailPrompt(data)));
  });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data }) => {
    const { meetingPrompt, renderPrompt } = await import("./prompts.server");
    return runStructured(MeetingOutput, renderPrompt(meetingPrompt(data)));
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TaskInput.parse(d))
  .handler(async ({ data }) => {
    const { taskPrompt, renderPrompt } = await import("./prompts.server");
    return runStructured(TaskOutput, renderPrompt(taskPrompt(data)));
  });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const { researchPrompt, renderPrompt } = await import("./prompts.server");
    return runStructured(ResearchOutput, renderPrompt(researchPrompt(data)));
  });
