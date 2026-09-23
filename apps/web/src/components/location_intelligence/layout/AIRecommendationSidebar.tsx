import React from "react";
import {
  Sparkles, Bot, BrainCircuit, Target,
  CheckCircle2, Compass, Users, TrendingUp,
  Award, MapPin, Layers
} from "lucide-react";
import { LocationAnalytics } from "../../../types/location";

interface AIRecommendationSidebarProps {
  analytics: LocationAnalytics;
  candidateLat: number;
  candidateLng: number;
  radius: number;
}

const SCORE_GRADIENTS = [
  "from-indigo-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-violet-600 to-purple-400",
  "from-pink-500 to-rose-400",
  "from-amber-500 to-orange-400"
];

const CARD_BORDER_GLOWS = [
  "hover:border-indigo-500/40 hover:shadow-indigo-500/10",
  "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
  "hover:border-violet-500/40 hover:shadow-violet-500/10",
  "hover:border-pink-500/40 hover:shadow-pink-500/10",
  "hover:border-amber-500/40 hover:shadow-amber-500/10"
];

function sanitizeNumbers(text: string): string {
  if (!text || typeof text !== "string") return text;
  // Remove patterns like "(0 POIs)" or "(39 POIs)" or "(18 POI)"
  let cleaned = text.replace(/\s*\(\s*\d+\s*POIs?\s*\)/gi, "");
  // Remove standalone numbers or ranges/ratios (e.g. 40/100, 218, 0, 39, etc.)
  cleaned = cleaned.replace(/\b\d+(?:\/\d+)?%?\b\s*/g, "");
  // Clean up double spaces or trailing punctuation spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export default function AIRecommendationSidebar({
  analytics,
  candidateLat,
  candidateLng,
  radius,
}: AIRecommendationSidebarProps) {
  const { kpis, top_recommendations, explanation, features } = analytics;

  // Extract LLM recommendations with a robust fallback mapping
  const llmRec = analytics.llm_recommendation || {
    best_advertising_domains: (top_recommendations || []).map(r => ({
      category: r.category,
      score: r.score,
      rationale: r.reason
    })),
    why_domains_fit: explanation?.summary || "No specific spatial context was retrieved to justify custom domain matches.",
    advantages_of_publishing: explanation?.positive || ["No positive spatial factors were detected."],
    target_audience: [
      {
        segment: "General Commuters & Residents",
        driven_by: "Local points of interest and transit stops",
        relevance: "General brand exposure across default commuter demographics."
      }
    ],
    area_strength_summary: explanation?.summary || "Analyzing spatial indicators..."
  };

  const hasDomains = llmRec.best_advertising_domains && llmRec.best_advertising_domains.length > 0;

  return (
    <div className="w-full border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090e1c]/90 p-5 sm:p-6 flex flex-col space-y-6 lg:min-h-full text-white shrink-0 min-w-0 box-border">
      
      {/* 1. HEADER */}
      <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400">
          <Bot size={22} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-blue-400 leading-tight">
            Media Strategy Agent
          </h2>
          <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider mt-0.5 inline-block">
            LLM-Reasoned Assessment
          </span>
        </div>
      </div>

      {/* 2. BEST ADVERTISING DOMAINS */}
      <div className="glassmorphism p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Award size={18} className="text-blue-400" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
            Best Advertising Domains
          </h3>
        </div>
        
        {hasDomains ? (
          <div className="space-y-4 pt-1">
            {llmRec.best_advertising_domains.map((dom, idx) => {
              const gradient = SCORE_GRADIENTS[idx % SCORE_GRADIENTS.length];
              const borderGlow = CARD_BORDER_GLOWS[idx % CARD_BORDER_GLOWS.length];
              return (
                <div key={dom.category} className={`bg-[#0d1424]/90 border border-white/10 p-4 rounded-xl space-y-3 transition-all duration-200 ${borderGlow}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-black text-white leading-snug">
                      {dom.category}
                    </span>
                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black font-mono text-blue-400">{dom.score}%</span>
                      <span className="text-[10px] text-white/50 block font-bold uppercase tracking-wider">Suitability</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-[#161f36] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
                      style={{ width: `${dom.score}%` }}
                    />
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {sanitizeNumbers(dom.rationale)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-white/50 text-sm">
            No suitable advertising domains identified.
          </div>
        )}
      </div>

      {/* 3. WHY THESE DOMAINS FIT */}
      <div className="glassmorphism p-5 sm:p-6 rounded-2xl border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <BrainCircuit size={18} className="text-blue-400" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-mono">
            Why These Domains Fit
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          {sanitizeNumbers(llmRec.why_domains_fit)}
        </p>
      </div>

      {/* 4. ADVANTAGES OF PUBLISHING ADS IN THIS AREA */}
      <div className="glassmorphism p-5 sm:p-6 rounded-2xl border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Compass size={18} className="text-blue-400" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
            Advantages in This Area
          </h3>
        </div>
        <div className="space-y-2.5 pt-1">
          {llmRec.advantages_of_publishing && llmRec.advantages_of_publishing.length > 0 ? (
            llmRec.advantages_of_publishing.map((adv, idx) => (
              <div key={idx} className="flex gap-3 text-xs sm:text-sm leading-relaxed text-slate-200 hover:text-white transition-colors group">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{sanitizeNumbers(adv)}</span>
              </div>
            ))
          ) : (
            <span className="text-sm text-white/50">No prominent advertising advantages detected.</span>
          )}
        </div>
      </div>

      {/* 5. TARGET AUDIENCE */}
      <div className="glassmorphism p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Users size={18} className="text-blue-400" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
            Target Audience Segments
          </h3>
        </div>
        <div className="space-y-3.5 pt-1">
          {llmRec.target_audience && llmRec.target_audience.length > 0 ? (
            llmRec.target_audience.map((aud, idx) => (
              <div key={idx} className="bg-[#0d1424]/90 border border-white/10 p-4 rounded-xl space-y-2.5 hover:bg-[#121b30] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-white leading-tight">{aud.segment}</span>
                  <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase rounded-md shrink-0 ml-2">
                    {aud.segment.split(" ")[0]}
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {sanitizeNumbers(aud.relevance)}
                </p>
                
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 font-medium">
                  <span>Driven by:</span>
                  <span className="font-bold text-blue-400">{sanitizeNumbers(aud.driven_by)}</span>
                </div>
              </div>
            ))
          ) : (
            <span className="text-sm text-white/50">No specific target audiences identified.</span>
          )}
        </div>
      </div>

    </div>
  );
}
