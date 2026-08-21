"use client";

import React from "react";
import Header from "@/components/layout/Header";
import MetricCards from "@/components/dashboard/MetricCards";
import WeeklyActivityChart from "@/components/dashboard/WeeklyActivityChart";
import MuscleFocusWidget from "@/components/dashboard/MuscleFocusWidget";
import RecentWorkouts from "@/components/dashboard/RecentWorkouts";

export default function DashboardPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting & Date Header */}
      <Header />

      {/* 4 Key Calisthenics Metrics */}
      <MetricCards />

      {/* Middle Section: Weekly Activity Bar Chart & Interactive Muscle Focus Body Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 xl:col-span-6 min-h-[340px]">
          <WeeklyActivityChart />
        </div>
        <div className="lg:col-span-6 xl:col-span-6 min-h-[340px]">
          <MuscleFocusWidget />
        </div>
      </div>

      {/* Bottom Section: Recent Workouts */}
      <div className="grid grid-cols-1 gap-5">
        <div className="min-h-[290px]">
          <RecentWorkouts />
        </div>
      </div>
    </div>
  );
}
