import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, type ModelMessage } from "ai";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { generateStubReply } from "@/lib/chat/responder";
import { chatTools } from "@/lib/chat/tools";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ChatRequest } from "@/lib/chat/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const STUB_CHUNK_DELAY_MS = 18;

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body?.sessionId || !Array.isArray(body.messages)) {
    return new Response("Missing sessionId or messages", { status: 400 });
  }

  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);

  // ─── Real AI path ─────────────────────────────────────────────────────
  if (hasOpenAi) {
    const modelMessages = toModelMessages(body.messages);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: buildSystemPrompt(),
      messages: modelMessages,
      tools: chatTools,
      // Allow the model to take a tool call + a follow-up text turn in one request.
      stopWhen: stepCountIs(5),
      temperature: 0.6,
      maxOutputTokens: 400,
      onFinish: async (event) => {
        try {
          await saveTurn(body.sessionId, body.messages, event.text);
        } catch (err) {
          console.error("[chat] persist failed (ai path):", err);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ─── Stub fallback (no OPENAI_API_KEY set) ───────────────────────────
  // Keeps local dev usable without an OpenAI key. Pattern-matches intent
  // and streams the same plain-text format the AI path returns, so the
  // client behaves identically.
  const replyText = generateStubReply(body.messages);
  const encoder = new TextEncoder();
  const words = replyText.split(/(\s+)/);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const word of words) {
          controller.enqueue(encoder.encode(word));
          await new Promise((r) => setTimeout(r, STUB_CHUNK_DELAY_MS));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  void saveTurn(body.sessionId, body.messages, replyText).catch((err) => {
    console.error("[chat] persist failed (stub path):", err);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

// Map our wire-shape messages into the AI SDK's discriminated ModelMessage union.
function toModelMessages(
  messages: ChatRequest["messages"],
): ModelMessage[] {
  return messages.map((m) => {
    switch (m.role) {
      case "user":
        return { role: "user", content: m.content };
      case "assistant":
        return { role: "assistant", content: m.content };
      case "system":
        return { role: "system", content: m.content };
    }
  });
}

// Single persistence path shared by AI + stub branches.
async function saveTurn(
  sessionId: string,
  history: ChatRequest["messages"],
  replyText: string,
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();
  const fullMessages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "assistant" as const, content: replyText, ts: now },
  ];

  const { data: existing, error: selectErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (selectErr) throw selectErr;

  if (existing) {
    const { error } = await supabase
      .from("conversations")
      .update({ messages: fullMessages, last_message_at: now })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("conversations").insert({
      session_id: sessionId,
      started_at: now,
      last_message_at: now,
      messages: fullMessages,
    });
    if (error) throw error;
  }
}
