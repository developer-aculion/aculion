import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { LocationAnalytics } from "../../../types/location";

interface AIChatAssistantProps {
  analytics: LocationAnalytics;
}

export default function AIChatAssistant({ analytics }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: "user" | "bot";
    time: string;
  }>>([
    {
      id: "welcome",
      text: "Hello! I am your Aculion Location Intelligence Assistant. Ask me anything about this location's suitability, transit accessibility, or commercial potential!",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Math.random().toString(),
      text: input,
      sender: "user" as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userQuery = input.toLowerCase();
    setInput("");

    // Simulate typing delay
    setTimeout(() => {
      let replyText = "";
      const k = analytics.kpis;
      const f = analytics.features;
      const areaName = analytics.area || "this custom point";

      if (userQuery.includes("suitability") || userQuery.includes("score") || userQuery.includes("overall")) {
        replyText = `The overall suitability score for ${areaName} is ${k.overall_score}%. It has a commercial potential of ${k.commercial_potential}%, and footfall potential is rated at ${k.footfall_potential}%.`;
      } else if (userQuery.includes("transit") || userQuery.includes("traffic") || userQuery.includes("bus") || userQuery.includes("metro") || userQuery.includes("connect")) {
        replyText = `For transit networks, ${areaName} scores ${k.transit_connectivity}% in connectivity. There are ${f.bus_count} bus stops and ${f.metro_count} metro stations in the analysis zone.`;
      } else if (userQuery.includes("demographic") || userQuery.includes("population") || userQuery.includes("resident")) {
        replyText = `Regarding zoning features, the residential density is ${f.residential_density}% and commercial density is ${f.commercial_density}%.`;
      } else if (userQuery.includes("poi") || userQuery.includes("density") || userQuery.includes("shop") || userQuery.includes("restaurant")) {
        replyText = `There are ${f.total_pois} total POIs in this zone, averaging a POI density of ${f.poi_density}/km². The area mix contains ${f.commercial_density}% commercial activity.`;
      } else if (userQuery.includes("recommend") || userQuery.includes("business") || userQuery.includes("advertise")) {
        if (analytics.top_recommendations.length > 0) {
          const recs = analytics.top_recommendations.map(r => `• **${r.category}** (Score: ${r.score}%)`).join("\n");
          replyText = `Based on spatial metrics, the top recommended business categories for this area are:\n${recs}\n\nThis is optimized for the local commuter and zoning patterns.`;
        } else {
          replyText = `There are no strong recommendations due to insufficient POI and road data within the selected search radius.`;
        }
      } else {
        replyText = `I have received your query: "${userQuery}". In the next release, I will be integrated with a deep LLM model to analyze spatial features for you. For now, try asking me about "overall score", "transit accessibility", "zoning", or "top recommendations"!`;
      }

      setMessages((prev) => [...prev, {
        id: Math.random().toString(),
        text: replyText,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 700);
  };

  return (
    <div className="glassmorphism p-5 rounded-2xl border border-border flex flex-col h-[380px] space-y-3">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <Sparkles size={14} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider leading-none">Spatial AI Assistant</h3>
          <span className="text-[8px] text-emerald-400 font-bold uppercase mt-1 inline-block">Demo Mode</span>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[220px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            <div className={`p-1.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white ${
              msg.sender === "user" ? "bg-blue-600" : "bg-zinc-800 border border-border/50"
            }`}>
              {msg.sender === "user" ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={`rounded-xl p-2.5 text-[11px] leading-relaxed ${
              msg.sender === "user"
                ? "bg-primary text-primary-foreground font-semibold rounded-tr-none"
                : "bg-background/80 border border-border/40 text-muted-foreground rounded-tl-none"
            }`}>
              <p className="whitespace-pre-line">{msg.text}</p>
              <span className="block text-[8px] text-muted-foreground/50 mt-1 text-right font-mono">
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 border-t border-border/40 pt-2">
        <input
          type="text"
          placeholder="Ask about suitability, transit, etc..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-background/50 border border-border/80 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 text-foreground"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-primary hover:bg-blue-600 active:scale-95 text-white rounded-xl transition-all duration-150"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
