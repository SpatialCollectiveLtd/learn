"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  className?: string;
}

export function FloatingHeader({ showBackButton = false, backHref = "/", className }: FloatingHeaderProps) {
  const pathname = usePathname();
  
  return (
    <header className={cn(
      "fixed top-4 left-1/2 -translate-x-1/2 z-50",
      "w-[calc(100%-2rem)] max-w-2xl",
      className
    )}>
      <div className="backdrop-blur-md bg-black/60 border border-[#262626]/50 rounded-2xl shadow-2xl">
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* Left - Back Button or Logo */}
          {showBackButton ? (
            <Link 
              href={backHref}
              className="flex items-center gap-1.5 text-[#a3a3a3] hover:text-[#dc2626] transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-medium">Back</span>
            </Link>
          ) : (
            <div className="opacity-0 pointer-events-none">
              <span className="text-xs">Back</span>
            </div>
          )}
          
          {/* Center - Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-[#dc2626] text-xl font-bold font-heading">SC</div>
            <div className="hidden sm:block">
              <span className="text-sm font-heading font-bold text-white">Spatial Collective</span>
            </div>
          </Link>
          
          {/* Right - Spacer for balance */}
          <div className="w-12"></div>
        </div>
      </div>
    </header>
  );
}
