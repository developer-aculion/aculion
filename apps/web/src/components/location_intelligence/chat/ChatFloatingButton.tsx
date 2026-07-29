import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../../assets/aculion_logo_transparent.png";

interface ChatFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChatFloatingButton({ isOpen, onClick }: ChatFloatingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-[999] h-14 w-14 rounded-full overflow-hidden flex items-center justify-center border shadow-premium transition-all duration-300 ${
        isOpen
          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,85,255,0.45)]"
          : "border-white/10 bg-card hover:border-primary/40 hover:shadow-[0_0_15px_rgba(0,85,255,0.25)]"
      }`}
    >
      {isOpen ? (
        <X size={20} className="text-white" />
      ) : (
        <div className="relative w-full h-full p-0.5 bg-zinc-900 flex items-center justify-center rounded-full">
          <img src={logo} alt="Aculion AI Chat" className="w-full h-full object-cover scale-110 rounded-full" />
          {/* Glowing pulse ring */}
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-60 pointer-events-none" />
        </div>
      )}
    </motion.button>
  );
}
