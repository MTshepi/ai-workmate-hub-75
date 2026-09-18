import { createOpenAI } from "@ai-sdk/openai";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    }) as typeof fetch,
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

/** Responses-API provider for openai/* models via Lovable AI Gateway. */
export function createLovableResponsesProvider(key: string, initialRunId?: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { provider, runIdFetch };
}

export const CHAT_MODEL = "openai/gpt-6-astra";

export const reasoningOptions = (effort: "low" | "medium" = "low") => ({
  openai: {
    forceReasoning: true,
    reasoningEffort: effort,
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
});

export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
}

export function getLovableAiGatewayResponseHeaders(
  providerHeaders: HeadersInit | undefined,
  init?: HeadersInit,
) {
  const headers = new Headers(init);
  const exposed = new Set(
    (headers.get("Access-Control-Expose-Headers") ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
  );
  new Headers(providerHeaders).forEach((value, name) => {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) {
      headers.set(name, value);
      exposed.add(name);
    }
  });
  headers.forEach((_, name) => {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) exposed.add(name);
  });
  if (exposed.size > 0) {
    headers.set("Access-Control-Expose-Headers", Array.from(exposed).join(", "));
  }
  return headers;
}

export async function withLovableAiGatewayRunIdHeader(
  response: Response,
  gateway: { getRunId: () => string | undefined; waitForRunId: () => Promise<string | undefined> },
) {
  if (!response.body) return response;
  const reader = response.body.getReader();
  const firstChunk = reader.read();
  const runId = await gateway.waitForRunId();
  const headers = getLovableAiGatewayResponseHeaders(undefined, response.headers);
  if (runId) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
  const body = new ReadableStream({
    async start(controller) {
      try {
        const first = await firstChunk;
        if (first.done) return controller.close();
        controller.enqueue(first.value);
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          controller.enqueue(chunk.value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason?: unknown) {
      return reader.cancel(reason);
    },
  });
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: getLovableAiGatewayResponseHeaders(undefined, headers),
  });
}

/** Map gateway/SDK failures to safe, user-facing messages (terminal vs retryable). */
export function toFriendlyAiError(error: unknown): { message: string; status: number } {
  const status =
    typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 0;
  const raw = error instanceof Error ? error.message : String(error);
  switch (status) {
    case 400:
      return { status, message: "The request was invalid. Try shortening or rewording your input." };
    case 401:
      return { status, message: "AI is not configured for this workspace yet." };
    case 402:
      return { status, message: "AI credits are exhausted. Add credits in workspace billing to continue." };
    case 403:
      return { status, message: "This request was blocked by the AI provider or workspace policy." };
    case 429:
      return { status, message: "AI is rate limited right now. Please wait a moment and try again." };
    default:
      if (status >= 500) return { status, message: "The AI service had a temporary problem. Please try again." };
      return { status: status || 500, message: raw || "Something went wrong while contacting the AI." };
  }
}
