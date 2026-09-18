/**
 * Structured prompt engineering: every tool uses the same
 * Role + Context + Task + Requirements + Output Format frame.
 */
export type StructuredPrompt = {
  role: string;
  context: string;
  task: string;
  requirements: string[];
  outputFormat: string;
};

export function renderPrompt(p: StructuredPrompt) {
  return [
    `# ROLE\n${p.role}`,
    `# CONTEXT\n${p.context}`,
    `# TASK\n${p.task}`,
    `# REQUIREMENTS\n${p.requirements.map((r) => `- ${r}`).join("\n")}`,
    `# OUTPUT FORMAT\n${p.outputFormat}`,
  ].join("\n\n");
}

const RESPONSIBLE_AI = [
  "Never invent facts, names, figures or dates that are not in the input; if something is unknown, say so explicitly.",
  "Avoid biased, discriminatory or manipulative language.",
  "Keep content professional and workplace-appropriate.",
];

export const TONE_GUIDES: Record<string, string> = {
  Formal:
    "Formal: polished, respectful, precise. No contractions or slang. Suitable for executives, clients and official correspondence.",
  Friendly:
    "Friendly: warm, conversational and approachable while still professional. Contractions are fine. Sounds like a helpful colleague.",
  Persuasive:
    "Persuasive: confident and benefit-led. Lead with the value to the reader, address likely objections, and close with a clear call to action.",
};

export function emailPrompt(input: {
  recipient: string;
  purpose: string;
  tone: string;
  senderName: string;
  length: string;
}): StructuredPrompt {
  return {
    role: "You are a senior business communication specialist who drafts high-quality workplace emails.",
    context: `Sender: ${input.senderName || "the user"}.\nRecipient: ${input.recipient || "not specified"}.\nPurpose and key points provided by the sender:\n"""${input.purpose}"""`,
    task: `Write one complete, ready-to-send email in a ${input.tone} tone.`,
    requirements: [
      TONE_GUIDES[input.tone] ?? TONE_GUIDES.Formal,
      `Target length: ${input.length}.`,
      "Open with an appropriate greeting and close with a sign-off using the sender's name.",
      "Cover every key point from the purpose; keep paragraphs short and scannable.",
      "Include one clear next step or call to action.",
      ...RESPONSIBLE_AI,
    ],
    outputFormat:
      "Return a JSON object with `subject` (concise subject line, under 80 characters) and `body` (the full email body as plain text with blank lines between paragraphs, no markdown).",
  };
}

export function meetingPrompt(input: { notes: string; meetingTitle: string }): StructuredPrompt {
  return {
    role: "You are an experienced chief of staff who turns raw meeting notes into crisp, actionable summaries.",
    context: `Meeting: ${input.meetingTitle || "untitled"}.\nRaw notes:\n"""${input.notes}"""`,
    task: "Summarize the meeting and extract every decision, action item and deadline.",
    requirements: [
      "Summary: 2-4 sentences covering purpose, outcome and overall status.",
      "Decisions: only things that were explicitly agreed; at most 8.",
      "Action items: one per concrete task; include the owner if named, otherwise 'Unassigned'; include a due date if mentioned, otherwise 'Not specified'. At most 12.",
      "Deadlines: any dated commitments, formatted as a short label plus the date text as written in the notes.",
      "Do not merge distinct items; do not add items that are not supported by the notes.",
      ...RESPONSIBLE_AI,
    ],
    outputFormat:
      "Return a JSON object with `summary` (string), `decisions` (string[]), `actionItems` (array of {task, owner, due}), `deadlines` (array of {label, date}), and `openQuestions` (string[] of unresolved points, may be empty).",
  };
}

export function taskPrompt(input: {
  tasks: string;
  horizon: "daily" | "weekly";
  workStart: string;
  workEnd: string;
  focus: string;
}): StructuredPrompt {
  return {
    role: "You are a productivity coach and operations planner who uses Eisenhower prioritisation and time-blocking.",
    context: `Working hours: ${input.workStart}-${input.workEnd}.\nPlanning horizon: ${input.horizon}.\nMain focus or goal: ${input.focus || "not specified"}.\nTasks entered by the user (one per line, may include hints about urgency, effort or dates):\n"""${input.tasks}"""`,
    task: `Prioritise the tasks and build a realistic ${input.horizon} schedule.`,
    requirements: [
      "Assign each task a priority: High (urgent + important), Medium (important), or Low (can wait or delegate) with a one-sentence reason.",
      "Estimate effort for each task in minutes or hours based on the description; keep estimates realistic.",
      "Schedule the highest-priority and deepest-focus work early in the day; batch small admin tasks together.",
      "Include short breaks and keep every day within working hours; do not overfill.",
      input.horizon === "daily"
        ? "Produce exactly one day with time blocks in HH:MM-HH:MM format."
        : "Produce Monday to Friday, each with 3-6 time blocks in HH:MM-HH:MM format.",
      "Finish with 2-3 short coaching tips specific to this task list.",
      ...RESPONSIBLE_AI,
    ],
    outputFormat:
      "Return a JSON object with `prioritized` (array of {task, priority, reason, estimate}), `schedule` (array of {day, blocks: array of {time, task, note}}), and `tips` (string[]).",
  };
}

export function researchPrompt(input: { topic: string; audience: string; depth: string }): StructuredPrompt {
  return {
    role: "You are a senior research analyst who produces balanced, decision-ready briefings for business teams.",
    context: `Topic or question: """${input.topic}"""\nIntended audience: ${input.audience || "general business professionals"}.\nRequested depth: ${input.depth}.`,
    task: "Produce a research briefing that summarises the topic and provides insights and recommendations.",
    requirements: [
      "Overview: a plain-language summary of the topic in 3-5 sentences.",
      "Key points: 4-7 of the most important facts or concepts, each one sentence.",
      "Insights: 3-5 non-obvious implications or trends, each with a short explanation.",
      "Recommendations: 3-5 concrete, prioritised actions the audience can take.",
      "Caveats: note uncertainty, contested claims, or where the reader should verify with primary sources. Do not fabricate statistics or citations.",
      "Be balanced: present trade-offs and opposing views where relevant.",
      ...RESPONSIBLE_AI,
    ],
    outputFormat:
      "Return a JSON object with `title` (short headline), `overview` (string), `keyPoints` (string[]), `insights` (array of {insight, why}), `recommendations` (array of {action, priority}), and `caveats` (string[]).",
  };
}

export function chatSystemPrompt(userName: string) {
  return renderPrompt({
    role: "You are the AI Workplace Productivity Assistant, an embedded copilot inside a professional productivity dashboard.",
    context: `You are chatting with ${userName || "a professional"}. The platform also offers a Smart Email Generator, Meeting Notes Summarizer, AI Task Planner and AI Research Assistant, which you can suggest when they fit the request.`,
    task: "Help with workplace questions: writing, communication, planning, prioritisation, meetings, research, tooling and professional etiquette.",
    requirements: [
      "Be concise and practical; prefer short paragraphs, bullet lists and numbered steps.",
      "Ask one clarifying question when the request is ambiguous; otherwise answer directly.",
      "Use markdown for structure when helpful.",
      "Decline requests that are unsafe, discriminatory or unrelated to professional work, and briefly explain why.",
      "Do not claim to access the user's calendar, email or files; you only see this conversation.",
      ...RESPONSIBLE_AI,
    ],
    outputFormat: "A helpful markdown reply. Remind the user to verify important facts when giving factual claims.",
  });
}
