"use client";

import { useMotionValue, motion, useMotionTemplate, useTransform } from "framer-motion";
import React, { MouseEvent as ReactMouseEvent, useRef } from "react";
import { cn } from "@/lib/utils";

export const CometCard = ({
  children,
  className,
  rotateDepth = 17.5,
  translateDepth = 20,
}: {
  children: React.ReactNode;
  className?: string;
  rotateDepth?: number;
  translateDepth?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [rotateDepth, -rotateDepth]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-rotateDepth, rotateDepth]);
  const translateX = useTransform(mouseX, [-0.5, 0.5], [-translateDepth, translateDepth]);
  const translateY = useTransform(mouseY, [-0.5, 0.5], [-translateDepth, translateDepth]);

  function onMouseMove({ currentTarget, clientX, clientY }: ReactMouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={ref}
      className={cn("perspective-1000", className)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          translateX,
          translateY,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length: number = 4) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
