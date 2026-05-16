import { NextRequest } from "next/server";
import { generateStubReply } from "@/lib/chat/responder";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ChatRequest } from "@/lib/chat/types";

export const runtime = "nodejs";

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
  // TODO(opana): when OPENAI_API_KEY is set, swap this branch to
  // streamText + tools using @ai-sdk/openai. The wire format stays the same
  // (plain text chunks), so the client doesn't change.
  const replyText = hasOpenAi
    ? generateStubReply(body.messages) // placeholder until real wiring
    : generateStubReply(body.messages);

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

  // Fire-and-forget persistence so the stream isn't blocked.
  void persistConversation(body, replyText).catch((err) => {
    console.error("[chat] failed to persist conversation:", err);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function persistConversation(body: ChatRequest, reply: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();
  const fullMessages = [
    ...body.messages,
    { role: "assistant" as const, content: reply, ts: now },
  ];

  const { data: existing } = await supabase
    .from("conversations")
    .select("id, started_at")
    .eq("session_id", body.sessionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("conversations")
      .update({
        messages: fullMessages,
        last_message_at: now,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("conversations").insert({
      session_id: body.sessionId,
      started_at: now,
      last_message_at: now,
      messages: fullMessages,
    });
  }
}
