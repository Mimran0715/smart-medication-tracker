"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function OptionalHeader() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return <Header />;
}