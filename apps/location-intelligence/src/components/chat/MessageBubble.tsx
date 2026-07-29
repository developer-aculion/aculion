import React from "react";
import { User, MapPin, ArrowLeftRight, Activity } from "lucide-react";
import logo from "@/assets/logo.jpg";

interface RecommendationItem {
  name: string;
  latitude: number;
  longitude: number;
  score: number;
  commercial_potential: number;
  footfall_potential: number;
  transit_score: number;
  residential_score: number;
  reasons: string[];
  distance: number;
  categories: string[];
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
  recommendations?: RecommendationItem[];
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";

  const parseMarkdown = (text: string): React.ReactNode => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content: React.ReactNode = line;
      let isBullet = false;
      
      if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
        isBullet = true;
        line = line.trim().substring(2);
      }
      
      // Parse bold **text**
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      if (parts.length > 1) {
        content = parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i} className={`font-black ${isUser ? "text-white" : "text-blue-400"}`}>{part}</strong> : part
        );
      }
      
      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-[11px] leading-relaxed text-muted-foreground">
            {content}
          </li>
        );
      }
      return <p key={idx} className="mb-1.5 text-[11px] leading-relaxed">{content}</p>;
    });
  };

  const handleViewOnMap = (lat: number, lng: number) => {
    window.dispatchEvent(new CustomEvent("chat-view-on-map", {
      detail: { latitude: lat, longitude: lng }
    }));
  };

  const handleAnalyze = (lat: number, lng: number) => {
    window.dispatchEvent(new CustomEvent("chat-analyze-site", {
      detail: { latitude: lat, longitude: lng }
    }));
  };

  const handleCompare = (name: string) => {
    window.dispatchEvent(new CustomEvent("chat-send-message", {
      detail: { text: `Compare ${name.toLowerCase()} and OMR` }
    }));
  };

  return (
    <div className={`flex gap-2.5 w-full ${isUser ? "max-w-[85%] ml-auto flex-row-reverse" : "max-w-full"}`}>
      {/* Avatar */}
      <div className={`h-6 w-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
        isUser ? "bg-primary text-white" : "bg-zinc-800 border border-border/50"
      }`}>
        {isUser ? (
          <User size={12} />
        ) : (
          <img src={logo} alt="Bot" className="w-full h-full object-cover scale-110" />
        )}
      </div>

      {/* Bubble Content */}
      <div className={`rounded-xl px-3 py-2.5 shadow-lg flex-1 min-w-0 ${
        isUser
          ? "bg-primary text-primary-foreground font-medium rounded-tr-none max-w-[85%]"
          : "bg-secondary/60 border border-border/30 text-muted-foreground rounded-tl-none max-w-[90%]"
      }`}>
        <div className="break-words font-sans">
          {parseMarkdown(message.text)}
        </div>

        {/* Professional Recommendations Cards List */}
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="mt-4 space-y-4 w-full">
            {message.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-zinc-950/80 border border-white/10 rounded-xl p-3.5 space-y-3.5 shadow-premium transition-all duration-200 hover:border-primary/40 text-foreground"
              >
                {/* Header Section */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight truncate max-w-[200px]">{rec.name}</h4>
                    <span className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider block mt-0.5">
                      {(rec.distance / 1000).toFixed(2)} km away
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-black font-mono text-emerald-400 leading-none">{rec.score}</span>
                    <span className="text-[7px] text-muted-foreground/60 uppercase tracking-widest font-black mt-0.5 leading-none">Suitability</span>
                  </div>
                </div>

                {/* Scores Grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-b border-border/20 py-2.5">
                  <div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 mb-0.5">
                      <span>Commercial</span>
                      <span className="font-mono text-white font-bold">{rec.commercial_potential}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rec.commercial_potential}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 mb-0.5">
                      <span>Footfall</span>
                      <span className="font-mono text-white font-bold">{rec.footfall_potential}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${rec.footfall_potential}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 mb-0.5">
                      <span>Transit</span>
                      <span className="font-mono text-white font-bold">{rec.transit_score}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${rec.transit_score}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 mb-0.5">
                      <span>Residential</span>
                      <span className="font-mono text-white font-bold">{rec.residential_score}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: `${rec.residential_score}%` }} />
                    </div>
                  </div>
                </div>

                {/* Top Reasons Checklist */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-wider">Top Reasons:</span>
                  <div className="space-y-1 pl-0.5">
                    {rec.reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed">
                        <span className="text-emerald-400 shrink-0 select-none">✓</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories row */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {rec.categories.map((cat, catIdx) => (
                    <span
                      key={catIdx}
                      className="px-2 py-0.5 bg-zinc-900 border border-white/5 text-[8px] font-bold text-muted-foreground rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Interactive Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border/20">
                  <button
                    onClick={() => handleViewOnMap(rec.latitude, rec.longitude)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-1 bg-zinc-900 hover:bg-primary hover:text-white rounded-lg text-[9px] font-extrabold uppercase transition-all duration-150 active:scale-95 text-muted-foreground"
                  >
                    <MapPin size={11} className="shrink-0" />
                    <span>View Map</span>
                  </button>
                  <button
                    onClick={() => handleCompare(rec.name)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-1 bg-zinc-900 hover:bg-primary hover:text-white rounded-lg text-[9px] font-extrabold uppercase transition-all duration-150 active:scale-95 text-muted-foreground"
                  >
                    <ArrowLeftRight size={11} className="shrink-0" />
                    <span>Compare</span>
                  </button>
                  <button
                    onClick={() => handleAnalyze(rec.latitude, rec.longitude)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-1 bg-primary/25 border border-primary/30 hover:bg-primary hover:text-white text-primary rounded-lg text-[9px] font-extrabold uppercase transition-all duration-150 active:scale-95"
                  >
                    <Activity size={11} className="shrink-0" />
                    <span>Analyze</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <span className="block text-[8px] opacity-40 mt-1.5 text-right font-mono select-none">
          {message.time}
        </span>
      </div>
    </div>
  );
}
