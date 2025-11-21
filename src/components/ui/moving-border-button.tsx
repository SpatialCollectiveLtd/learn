"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MovingBorderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  borderClassName?: string;
  duration?: number;
}

export function MovingBorderButton({
  children,
  onClick,
  disabled = false,
  className,
  borderClassName,
  duration = 2000,
}: MovingBorderButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center gap-2",
        "px-6 py-2.5 rounded-lg",
        "bg-black border border-[#262626]",
        "text-white text-sm font-medium",
        "transition-all duration-200",
        "hover:bg-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed",
        "overflow-hidden group",
        className
      )}
    >
      {/* Animated border gradient */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
          borderClassName
        )}
        style={{
          background: "linear-gradient(90deg, transparent, #dc2626, transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "200% 0%"],
        }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Inner content container */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-[#dc2626]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
    </button>
  );
}
