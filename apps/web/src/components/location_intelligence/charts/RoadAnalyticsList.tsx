"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { RoadAnalyticsData } from "../../../types/location";

interface RoadAnalyticsListProps {
  data: RoadAnalyticsData;
}

export default function RoadAnalyticsList({ data }: RoadAnalyticsListProps) {
  const chartData = [
    { subject: "Connectivity", value: data?.connectivity || 0 },
    { subject: "Accessibility", value: data?.accessibility || 0 },
    { subject: "Walkability", value: data?.walkability || 0 },
    { subject: "Traffic Density", value: data?.trafficDensity || 0 },
    { subject: "Road Quality", value: data?.roadQuality || 0 },
    { subject: "Public Transport", value: data?.publicTransport || 0 },
  ];

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
          <PolarAngleAxis 
            dataKey="subject" 
            stroke="#ffffff" 
            fontSize={10}
            tick={{ fill: "#ffffff", fontSize: 10 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            stroke="rgba(255, 255, 255, 0.25)" 
            tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 8 }}
          />
          <Radar
            name="Infrastructure Rating"
            dataKey="value"
            stroke="#0055ff"
            fill="#0055ff"
            fillOpacity={0.25}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0e0f12",
              borderColor: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "11px",
              color: "#ffffff"
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
