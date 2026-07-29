import React from "react";
import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-2.5 max-w-[85%] items-start">
      <div className="p-1.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-zinc-800 border border-border/50 text-blue-400">
        <Bot size={12} />
      </div>
      <div className="bg-secondary/60 border border-border/40 text-muted-foreground rounded-xl rounded-tl-none px-3.5 py-2.5 flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
      </div>
    </div>
  );
}
