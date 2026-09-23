import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import "../styles/location_intelligence.css";

import Providers from "../components/location_intelligence/providers";
import Dashboard from "../components/location_intelligence/views/Dashboard";
import Billboards from "../components/location_intelligence/views/Billboards";

export default function LocationIntelligence({ selectedBillboard }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Providers>
      <div className="location-intelligence-root w-full min-h-full bg-[#070913] text-white overflow-x-hidden overflow-y-auto">
        {activeTab === "billboards" ? (
          <Billboards />
        ) : (
          <Dashboard selectedBillboard={selectedBillboard} />
        )}
      </div>
    </Providers>
  );
}
