export function TypingIndicator() {
  return (
    <div
      aria-label="Brew is typing"
      role="status"
      className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3"
    >
      <span className="dot-1 block h-1.5 w-1.5 rounded-full bg-primary/70" />
      <span className="dot-2 block h-1.5 w-1.5 rounded-full bg-primary/70" />
      <span className="dot-3 block h-1.5 w-1.5 rounded-full bg-primary/70" />
    </div>
  );
}
