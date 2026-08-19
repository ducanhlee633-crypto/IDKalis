"use client";

import React, { useState } from "react";
import ProgressHeader from "@/components/progress/ProgressHeader";
import MetricKpiCards from "@/components/progress/MetricKpiCards";
import PerformanceTrendCard from "@/components/progress/PerformanceTrendCard";
import TrainingConsistencyCard from "@/components/progress/TrainingConsistencyCard";
import SkillProgressTable from "@/components/progress/SkillProgressTable";
import CurrentBottleneckCard from "@/components/progress/CurrentBottleneckCard";

export default function ProgressPage() {
  const [timeframe, setTimeframe] = useState("30d");

  return (
    <div className="space-y-4 pb-10">
      {/* Top Header */}
      <ProgressHeader timeframe={timeframe} setTimeframe={setTimeframe} />

      {/* Top 5 KPI Metrics (Strength, Skill, Volume, Consistency, Recovery) */}
      <MetricKpiCards />

      {/* Middle Row: Performance Trend Chart & Training Consistency Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PerformanceTrendCard />
        <TrainingConsistencyCard />
      </div>

      {/* Bottom Row: Skill Progress Milestone Table & Current Bottleneck Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkillProgressTable />
        <CurrentBottleneckCard />
      </div>
    </div>
  );
}
