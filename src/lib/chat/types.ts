export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  // Set when a message represents a completed tool action.
  toolResult?: {
    kind: "cupping_booking" | "bean_order";
    summary: string;
    id?: string;
  };
}

export interface ChatRequest {
  sessionId: string;
  messages: Pick<ChatMessage, "role" | "content">[];
}

export const INITIAL_BOT_MESSAGE: Omit<ChatMessage, "id" | "createdAt"> = {
  role: "assistant",
  content:
    "Hey there! I'm Brew, the AI assistant for Bramble & Brew ☕\n\nI can tell you about our menu, beans, opening hours, or help you book a cupping session. What can I help with?",
};
