"use client";

import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

export default function WorkoutTimer({ onTick }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onTick]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1a1a22] border border-cyan-400/30 text-cyan-400 text-sm font-mono font-semibold">
      <Timer className="w-4 h-4" />
      <span>{display}</span>
    </div>
  );
}
