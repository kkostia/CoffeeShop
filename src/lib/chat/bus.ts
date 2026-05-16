"use client";

// Tiny event bus that lets any component on the page open the chatbot,
// optionally pre-filling the input with a starter message.

const OPEN = "bramble:chat-open";

export function openChat(prefill?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPEN, { detail: { prefill: prefill ?? "" } }),
  );
}

export function subscribeChatOpen(
  handler: (prefill: string) => void,
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ prefill?: string }>).detail;
    handler(detail?.prefill ?? "");
  };
  window.addEventListener(OPEN, listener);
  return () => window.removeEventListener(OPEN, listener);
}
