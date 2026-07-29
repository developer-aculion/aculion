"use client";

import React from "react";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
