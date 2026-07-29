import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import "../styles/location_intelligence.css";

import Providers from "../components/location_intelligence/providers";
import Dashboard from "../components/location_intelligence/views/Dashboard";
import Billboards from "../components/location_intelligence/views/Billboards";

export default function LocationIntelligence() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Providers>
      <div className="location-intelligence-root h-full w-full min-h-screen bg-[#030305] text-white overflow-y-auto overflow-x-hidden">
        {activeTab === "billboards" ? (
          <Billboards />
        ) : (
          <Dashboard />
        )}
      </div>
    </Providers>
  );
}
