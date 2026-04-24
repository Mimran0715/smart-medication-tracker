"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function OptionalHeader({
  onNotificationsClick,
}: {
  onNotificationsClick?: () => void;
}) {
  const pathname = usePathname();

  if (pathname === "/login" || 
    pathname === "/onboarding" || 
    pathname.startsWith("/reminder") ||
    pathname.startsWith("/dashboard") 
    ) return null;

   return <Header onNotificationsClick={onNotificationsClick} />;
}