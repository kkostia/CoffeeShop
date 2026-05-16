"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, RotateCcw, X } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;
  prefill: string;
  onClose: () => void;
  onReset: () => void;
  onSend: (text: string) => void;
  onClearPrefill: () => void;
}

export function ChatPanel({
  messages,
  pending,
  error,
  prefill,
  onClose,
  onReset,
  onSend,
  onClearPrefill,
}: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onClearPrefill();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [prefill, onClearPrefill]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    onSend(trimmed);
    setInput("");
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.style.height = "auto";
    });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.currentTarget;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  return (
    <motion.div
      key="chat-panel"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden bg-card text-foreground",
        "shadow-[0_30px_80px_-20px_rgba(45,31,20,0.5)]",
        // Mobile: full screen
        "inset-0 rounded-none",
        // Desktop: floating panel bottom-right
        "md:inset-auto md:bottom-6 md:right-6 md:h-[640px] md:max-h-[80vh] md:w-[400px] md:rounded-3xl md:border md:border-border",
      )}
      role="dialog"
      aria-label="Chat with Brew"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="font-display text-sm">b&amp;b</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base leading-tight">
              Brew, our AI barista
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success align-middle" />
              Online · usually replies instantly
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Reset conversation"
            onClick={onReset}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Close chat"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {pending ? (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-foreground">
            {error}
          </div>
        ) : null}
      </div>

      {/* Quick suggestions — show only when conversation is short */}
      {messages.length <= 1 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border bg-card/60 px-4 py-3">
          {[
            "What's on the bar today?",
            "Are you open Sunday?",
            "Book a cupping session",
          ].map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => onSend(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-muted disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border bg-card px-3 py-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ask about menu, beans, hours…"
          aria-label="Message Brew"
          className={cn(
            "flex-1 resize-none rounded-3xl border border-border bg-background/60 px-4 py-2.5 text-sm",
            "leading-relaxed text-foreground placeholder:text-muted-foreground/70",
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
            "max-h-[140px]",
          )}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          aria-label="Send"
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground transition-[transform,opacity] duration-200",
            "[transition-timing-function:var(--ease-cafe)]",
            "hover:scale-[1.04] active:scale-95",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}
