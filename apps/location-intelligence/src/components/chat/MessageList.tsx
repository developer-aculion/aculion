import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const containerEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={containerEndRef} />
    </div>
  );
}
