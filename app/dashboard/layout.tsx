"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import DashboardDrawer from "./notificationsDrawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {/* Dashboard-specific header (replaces OptionalHeader visually) */}
      <Header onNotificationsClick={() => setIsDrawerOpen(true)} />

      {children}

      <DashboardDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}