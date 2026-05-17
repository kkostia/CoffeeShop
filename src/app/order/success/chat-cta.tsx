"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openChat } from "@/lib/chat/bus";

export function ChatCta() {
  return (
    <Button variant="outline" onClick={() => openChat()}>
      <MessageCircle />
      Chat with Brew
    </Button>
  );
}
