import React, { useState, useEffect } from "react";
import { Trash2, X, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LocationAnalytics } from "@/types";
import MessageList from "./MessageList";
import SuggestedQuestionsPanel from "./SuggestedQuestionsPanel";
import InputBox from "./InputBox";
import logo from "@/assets/logo.jpg";
import { locationService } from "@/services/location.service";
import {
  ChatContext,
  ChatIntent,
  classifyIntent,
  extractSlotsFromText,
  fillSlot,
  getFirstMissingSlot,
  generateStaticReply
} from "@/services/conversationEngine";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
  recommendations?: any[];
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: LocationAnalytics;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
}

export default function ChatWindow({ isOpen, onClose, analytics, latitude, longitude, radius }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("aculion_chat_history");
      if (stored) return JSON.parse(stored);
    }
    return [
      {
        id: "welcome",
        text: "Hello! I am your **Aculion Location Intelligence Assistant**. Ask me anything about suitability, transit connectivity, or commercial potential of the selected location!",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);
  
  const [context, setContext] = useState<ChatContext>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("aculion_chat_context");
      if (stored) return JSON.parse(stored);
    }
    return {};
  });

  const [prevAnalytics, setPrevAnalytics] = useState<LocationAnalytics | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("aculion_prev_analytics");
      if (stored) return JSON.parse(stored);
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aculion_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aculion_chat_context", JSON.stringify(context));
    }
  }, [context]);

  useEffect(() => {
    if (analytics && analytics.area !== prevAnalytics?.area) {
      if (analytics.kpis.overall_score > 0) {
        if (prevAnalytics && typeof window !== "undefined") {
          sessionStorage.setItem("aculion_prev_analytics", JSON.stringify(prevAnalytics));
        }
        setPrevAnalytics(analytics);
      }
    }
  }, [analytics, prevAnalytics]);

  // ── Dispatch listener for compare clicked inside cards ──
  useEffect(() => {
    const handleChatSendMessage = (e: any) => {
      const { text } = e.detail;
      handleSendMsg(text);
    };
    window.addEventListener("chat-send-message", handleChatSendMessage);
    return () => {
      window.removeEventListener("chat-send-message", handleChatSendMessage);
    };
  }, [context]);

  const handleClearChat = () => {
    const defaultWelcome: Message = {
      id: "welcome",
      text: "Hello! I am your **Aculion Location Intelligence Assistant**. Ask me anything about suitability, transit connectivity, or commercial potential of the selected location!",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([defaultWelcome]);
    setContext({});
    setHasApiError(false);
  };

  const fetchRecommendations = async (ctx: ChatContext) => {
    setIsTyping(true);
    setHasApiError(false);

    const params = {
      brand: ctx.brand || "General",
      city: ctx.city || "Chennai",
      objective: ctx.objective || "Brand Awareness",
      budget: Number(ctx.budget) || 1000000,
      audience: ctx.audience || "General Public",
      duration: ctx.duration || "30 days",
      campaignType: ctx.campaignType || "Classic",
      radiusPreference: Number(ctx.radiusPreference) || radius || 1000,
      latitude: latitude ?? null,
      longitude: longitude ?? null
    };

    try {
      const data = await locationService.recommendBillboards(params);
      setIsTyping(false);

      if (data && data.success && data.recommendations && data.recommendations.length > 0) {
        setMessages((prev) => [...prev, {
          id: Math.random().toString(36).substring(7),
          text: `### Recommended Billboard Placements\nBased on your campaign objectives, our spatial database suggests the following **Top 5** recommended locations:`,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          recommendations: data.recommendations
        }]);

        // Reset context
        setContext({});
      } else {
        setMessages((prev) => [...prev, {
          id: Math.random().toString(36).substring(7),
          text: `We couldn't find any matching billboards in **${params.city}** in our active database. Would you like to clear context and try again?`,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    } catch (err) {
      console.error("[ChatWindow] recommendation query error: ", err);
      setIsTyping(false);
      setHasApiError(true);

      setMessages((prev) => [...prev, {
        id: Math.random().toString(36).substring(7),
        text: `⚠️ **Recommendation Service Offline**\nFailed to query the spatial recommendation engine. Please make sure the service backend is reachable and click **Retry Request** above the input box.`,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  };

  const handleSendMsg = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      text,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setHasApiError(false);

    // Simulate small latency
    setTimeout(async () => {
      const intent = classifyIntent(text);

      // Handle non-billboard intents
      if (intent !== "FIND_BEST_BILLBOARD" && !context.lastIntent) {
        const replyText = generateStaticReply(text, context, analytics, prevAnalytics);
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: Math.random().toString(36).substring(7),
          text: replyText,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        return;
      }

      // Handle slot-filling loop
      let updatedContext: ChatContext = { ...context, lastIntent: "FIND_BEST_BILLBOARD" as ChatIntent };

      if (context.lastSlotAsked) {
        updatedContext = fillSlot(context.lastSlotAsked, text, updatedContext);
      } else {
        // Pre-parse slots from user query
        updatedContext = extractSlotsFromText(text, updatedContext);
      }

      const missing = getFirstMissingSlot(updatedContext);

      if (missing) {
        updatedContext.lastSlotAsked = missing.key;
        setContext(updatedContext);
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: Math.random().toString(36).substring(7),
          text: missing.question,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      } else {
        updatedContext.lastSlotAsked = undefined;
        setContext(updatedContext);
        await fetchRecommendations(updatedContext);
      }
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.92 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-[88px] right-6 z-[999] w-[390px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-140px)]
                     glassmorphism rounded-2xl shadow-premium border border-white/10 flex flex-col overflow-hidden text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-card/60 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg overflow-hidden border border-border/60 p-0.5 bg-zinc-900">
                <img src={logo} alt="Aculion Logo" className="w-full h-full object-cover scale-110" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-wider uppercase text-foreground leading-none">Aculion AI</h3>
                  <Sparkles size={11} className="text-primary animate-pulse" />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] text-emerald-400 font-bold uppercase leading-none">Online</span>
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 rounded-lg border border-border bg-background/50 hover:bg-secondary hover:text-rose-400 text-muted-foreground transition-all duration-150 active:scale-95"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={onClose}
                title="Close Chat"
                className="p-1.5 rounded-lg border border-border bg-background/50 hover:bg-secondary hover:text-foreground text-muted-foreground transition-all duration-150 active:scale-95"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Active Slots Profile Bar */}
          {(context.brand || context.city || context.objective || context.budget || context.audience || context.duration || context.campaignType || context.radiusPreference) && (
            <div className="bg-zinc-900/60 backdrop-blur-sm border-b border-border/40 px-4 py-1.5 flex gap-1.5 items-center flex-wrap select-none max-h-[70px] overflow-y-auto scrollbar-none">
              <span className="text-[8px] font-black uppercase text-muted-foreground/60 mr-1">Profile:</span>
              {context.brand && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-[9px] font-bold text-blue-400 animate-fadeIn">
                  {context.brand}
                </span>
              )}
              {context.city && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-[9px] font-bold text-purple-400 animate-fadeIn">
                  {context.city}
                </span>
              )}
              {context.objective && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-[9px] font-bold text-orange-400 animate-fadeIn">
                  {context.objective}
                </span>
              )}
              {context.budget && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[9px] font-bold text-emerald-400 animate-fadeIn">
                  ₹{(Number(context.budget) / 100000).toFixed(1)}L
                </span>
              )}
              {context.audience && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-[9px] font-bold text-pink-400 animate-fadeIn">
                  {context.audience}
                </span>
              )}
              {context.campaignType && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[9px] font-bold text-indigo-400 animate-fadeIn">
                  {context.campaignType}
                </span>
              )}
              {context.radiusPreference && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[9px] font-bold text-cyan-400 animate-fadeIn">
                  {context.radiusPreference}m
                </span>
              )}
            </div>
          )}

          {/* API Failure Retry Alert */}
          {hasApiError && (
            <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between text-xs text-rose-400 select-none animate-slideDown">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>Recommendation query failed.</span>
              </div>
              <button
                onClick={() => fetchRecommendations(context)}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-755 text-white font-bold rounded text-[9px] uppercase tracking-wider transition-all duration-150 active:scale-95 shadow"
              >
                Retry Request
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0 bg-background/40">
            <MessageList messages={messages} isTyping={isTyping} />
          </div>

          {/* Footer Controls */}
          <div className="p-3 bg-card/40 border-t border-border/40 space-y-2">
            <SuggestedQuestionsPanel onQuestionClick={handleSendMsg} />
            <InputBox
              value={input}
              onChange={setInput}
              onSend={() => handleSendMsg(input)}
              disabled={isTyping}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
