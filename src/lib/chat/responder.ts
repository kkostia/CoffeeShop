import { beans, cafe, menu } from "@/lib/cafe-data";
import type { ChatMessage } from "./types";

// Stub responder used until OPENAI_API_KEY is set.
// Matches simple intents and returns a scripted reply so the chat UI is
// usable end-to-end during development.
export function generateStubReply(
  history: Pick<ChatMessage, "role" | "content">[],
): string {
  const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const text = last.toLowerCase();

  const match = (...keys: string[]) => keys.some((k) => text.includes(k));

  if (match("cupping", "book")) {
    return `Lovely choice. Cupping sessions are Sunday at 10am, €${cafe.cuppingPrice} per person, about 75 minutes with four coffees on the table.\n\nShare your name, email, party size, and preferred Sunday and I'll get it on the schedule. (Live bookings turn on when our team finishes wiring me up to the OpenAI brain ☕)`;
  }

  if (match("order", "buy beans", "delivery", "ship")) {
    const names = beans.map((b) => b.name).join(", ");
    return `Sure — we ship anywhere in Ireland, free over €30. We've got ${names} on roast right now. Which one and what bag size (250g, 500g, 1kg)?`;
  }

  if (match("menu", "espresso", "filter", "drink", "latte", "flat white", "v60", "cold brew")) {
    const signature = menu.espresso.find((i) => i.signature);
    return `The Flat White (€${signature?.price.toFixed(2)}) is our most-ordered — two ristretto shots and silky microfoam. If you're after something filter, the V60 changes daily; today it's the Ethiopia Yirgacheffe ☕`;
  }

  if (match("bean", "single origin", "yirgacheffe", "colombia", "brazil", "huila", "cerrado")) {
    return `We've got three on roast: ${beans
      .map((b) => `${b.name} (${b.tastingNotes.slice(0, 2).join(", ").toLowerCase()})`)
      .join("; ")}. Want me to set one aside or arrange delivery?`;
  }

  if (match("hour", "open", "closing", "close", "when")) {
    return `${cafe.hours[0]!.label}: ${cafe.hours[0]!.time}. ${cafe.hours[1]!.label}: ${cafe.hours[1]!.time}. Walk-ins always welcome.`;
  }

  if (match("where", "address", "location", "find", "directions")) {
    return `We're at ${cafe.address.street}, ${cafe.address.city} — the Latin Quarter end of Quay Street. There's a map in the Visit section just above ☕`;
  }

  if (match("wifi", "wi-fi", "internet")) {
    return "Yes — free wifi for guests, ask the team at the counter for the password.";
  }

  if (match("vegan", "oat", "soy", "coconut", "dairy")) {
    return "All milk drinks can go oat, soy, or coconut at no upcharge. Most days we have a vegan pastry too.";
  }

  if (match("laptop", "work", "wifi work")) {
    return "Weekdays are great for working. On weekends we politely ask laptops to wrap up around 11am so we can free up tables.";
  }

  if (match("dog", "pet")) {
    return "Well-behaved dogs are very welcome. Water bowls by the door.";
  }

  if (match("phone", "call", "contact")) {
    return `You can ring us on ${cafe.phone} or just walk in — we don't take reservations for the cafe.`;
  }

  if (match("hello", "hi ", "hey", "morning", "afternoon")) {
    return `Hello! What can I help you with today — menu, beans, opening hours, or a cupping session?`;
  }

  if (match("thank", "thanks", "cheers")) {
    return "My pleasure — see you on Quay Street ☕";
  }

  // Generic fallback
  return `I'm Brew, ${cafe.name}'s assistant — I can tell you about our menu, beans, hours, or help you book a Sunday cupping. What's on your mind?`;
}
