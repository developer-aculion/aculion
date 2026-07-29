import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function InputBox({ value, onChange, onSend, disabled }: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height of textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(100, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border/40 pt-2.5">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-background/50 border border-border/80 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/40 text-foreground overflow-y-auto max-h-[100px] leading-relaxed"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="p-2.5 bg-primary hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-primary disabled:hover:scale-100 active:scale-95 text-white rounded-xl transition-all duration-150 shrink-0"
      >
        <Send size={13} />
      </button>
    </div>
  );
}
