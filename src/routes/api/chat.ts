import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  CHAT_MODEL,
  createLovableResponsesProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  reasoningOptions,
  toFriendlyAiError,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { chatSystemPrompt } from "@/lib/prompts.server";

type ChatRequestBody = { messages?: unknown; userName?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured for this workspace yet.", { status: 500 });

        const initialRunId = getLovableAiGatewayRunId(request);
        const { provider, runIdFetch } = createLovableResponsesProvider(key, initialRunId);
        const messages = body.messages as UIMessage[];
        const userName = typeof body.userName === "string" ? body.userName : "";

        const result = streamText({
          model: provider.responses(CHAT_MODEL),
          system: chatSystemPrompt(userName),
          messages: await convertToModelMessages(messages.slice(-30)),
          providerOptions: reasoningOptions("low"),
          maxRetries: 0,
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: false,
            onError: (error) => toFriendlyAiError(error).message,
            headers: getLovableAiGatewayResponseHeaders(undefined, {
              ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
            }),
          }),
          runIdFetch,
        );
      },
    },
  },
});
