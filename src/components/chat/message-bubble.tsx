"use client";

import { motion } from "framer-motion";
import { Coffee } from "lucide-react";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isBot = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex w-full gap-2",
        isBot ? "justify-start" : "justify-end",
      )}
    >
      {isBot ? <BotAvatar /> : null}
      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap text-[14.5px] leading-relaxed",
          "rounded-2xl px-4 py-2.5",
          isBot
            ? "rounded-bl-md bg-muted text-foreground"
            : "rounded-br-md bg-primary text-primary-foreground",
        )}
      >
        {message.content || (isBot ? " " : "")}
      </div>
    </motion.div>
  );
}

function BotAvatar() {
  return (
    <div
      aria-hidden
      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <Coffee className="h-3.5 w-3.5" strokeWidth={2} />
    </div>
  );
}
