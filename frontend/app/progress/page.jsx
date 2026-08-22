"use client";

import React, { useState } from "react";
import ProgressHeader from "@/components/progress/ProgressHeader";
import MetricKpiCards from "@/components/progress/MetricKpiCards";
import PerformanceTrendCard from "@/components/progress/PerformanceTrendCard";
import TrainingConsistencyCard from "@/components/progress/TrainingConsistencyCard";

export default function ProgressPage() {
  const [timeframe, setTimeframe] = useState("30d");

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <ProgressHeader timeframe={timeframe} setTimeframe={setTimeframe} />

      {/* KPI Overview */}
      <MetricKpiCards />

      {/* Analytics Cards - optimized 2-column responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <PerformanceTrendCard timeframe={timeframe} />
        <TrainingConsistencyCard />
      </div>
    </div>
  );
}
