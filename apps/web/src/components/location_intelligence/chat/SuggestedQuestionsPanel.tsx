import React from "react";

interface SuggestedQuestionsPanelProps {
  onQuestionClick: (question: string) => void;
}

const QUESTIONS = [
  "What is the suitability score?",
  "Analyze transit connectivity",
  "Show recommended ad categories",
  "What is the local road density?",
  "Tell me about commercial activity",
];

export default function SuggestedQuestionsPanel({ onQuestionClick }: SuggestedQuestionsPanelProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 pr-1 scrollbar-none select-none">
      {QUESTIONS.map((q, idx) => (
        <button
          key={idx}
          onClick={() => onQuestionClick(q)}
          className="shrink-0 px-3 py-1.5 bg-zinc-900 hover:bg-primary hover:text-primary-foreground border border-border/80 hover:border-primary rounded-full text-[10px] font-semibold text-muted-foreground transition-all duration-150 active:scale-95"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
