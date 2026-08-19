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
      <div className={`location-intelligence-root h-full w-full bg-[#070913] text-white ${activeTab === "billboards" ? "min-h-screen overflow-y-auto overflow-x-hidden" : "overflow-hidden"}`}>
        {activeTab === "billboards" ? (
          <Billboards />
        ) : (
          <Dashboard selectedBillboard={selectedBillboard} />
        )}
      </div>
    </Providers>
  );
}
