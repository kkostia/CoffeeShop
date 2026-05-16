"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import { subscribeChatOpen } from "@/lib/chat/bus";
import {
  clearStoredChat,
  newSessionId,
  readStoredChat,
  writeStoredChat,
} from "@/lib/chat/storage";
import { INITIAL_BOT_MESSAGE, type ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedMessage(): ChatMessage {
  return { ...INITIAL_BOT_MESSAGE, id: makeId(), createdAt: Date.now() };
}

export function ChatLauncher() {
  const [open, setOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prefill, setPrefill] = React.useState("");

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    const stored = readStoredChat();
    if (stored) {
      setSessionId(stored.sessionId);
      setMessages(stored.messages);
    } else {
      setSessionId(newSessionId());
      setMessages([seedMessage()]);
    }
    setHydrated(true);
  }, []);

  // Persist
  React.useEffect(() => {
    if (!hydrated || !sessionId) return;
    writeStoredChat({ sessionId, messages });
  }, [hydrated, sessionId, messages]);

  // External "open chat" events from CTAs
  React.useEffect(() => {
    return subscribeChatOpen((p) => {
      setOpen(true);
      if (p) setPrefill(p);
    });
  }, []);

  const handleReset = React.useCallback(() => {
    clearStoredChat();
    const id = newSessionId();
    setSessionId(id);
    setMessages([seedMessage()]);
    setError(null);
  }, []);

  const handleSend = React.useCallback(
    async (text: string) => {
      if (!text.trim() || pending) return;
      setError(null);
      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: text.trim(),
        createdAt: Date.now(),
      };
      const assistantId = makeId();
      const placeholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };
      const wireHistory = [
        ...messages
          .filter((m) => m.role !== "system")
          .map(({ role, content }) => ({ role, content })),
        { role: userMsg.role, content: userMsg.content },
      ];

      setMessages((prev) => [...prev, userMsg, placeholder]);
      setPending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, messages: wireHistory }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`chat: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: acc } : m,
            ),
          );
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong sending that. Try again?");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setPending(false);
      }
    },
    [messages, pending, sessionId],
  );

  if (!hydrated) return null;

  return (
    <>
      {/* Floating launcher button — hidden when panel open on mobile */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-40",
          open ? "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100" : "",
          "transition-opacity duration-300",
        )}
      >
        <motion.button
          type="button"
          aria-label={open ? "Close chat" : "Open chat with Brew"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative inline-flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-[0_12px_30px_-8px_rgba(111,78,55,0.55)]",
            !open ? "ring-pulse" : "",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 inline-flex"
              >
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span
                key="msg"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 inline-flex"
              >
                <MessageCircle className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Hint chip on first paint, dismissed once opened */}
        {!open && messages.length <= 1 ? (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="pointer-events-none absolute -top-1.5 right-16 hidden whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-[0_8px_20px_-12px_rgba(45,31,20,0.4)] md:inline-flex"
          >
            Ask our AI barista
          </motion.span>
        ) : null}
      </div>

      <AnimatePresence>
        {open ? (
          <ChatPanel
            key="panel"
            messages={messages}
            pending={pending}
            error={error}
            prefill={prefill}
            onClose={() => setOpen(false)}
            onReset={handleReset}
            onSend={handleSend}
            onClearPrefill={() => setPrefill("")}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
