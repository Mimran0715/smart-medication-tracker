"use client";
import {useState, useRef, useEffect} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Props = {
  onNotificationsClick?: () => void;
};

export default function Header ({ onNotificationsClick }: Props) {
    const [open, setOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const { user, patientName, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-[#1AA1E3] border-b">
        <div className="flex items-center gap-2">
            <div className="relative" ref={popupRef}>
                <button
                onClick={() => setOpen(!open)}
                className="text-xl"
                >
                ❤️
                </button>
                {open && (
                <div className="absolute mt-2 left-0 bg-white border rounded shadow-md p-2">
                <Link
                    href="/medications"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                    >
                    Manage Medications
                </Link>
                <Link
                    href="/analytics"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                    >
                    View Analytics
                </Link>
                <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                    >
                    Settings
                </Link>
                <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                    Log Out
                </button>
                </div>
            )}
            </div>
            <Link href="/dashboard">
            <h1 className="font-bold text-lg text-[#FFFFFF] cursor-pointer">
                Smart Medication Tracker
            </h1>
            </Link>
        </div>

        
        <div className="flex items-center gap-4">
            {onNotificationsClick && (
                <button
                onClick={onNotificationsClick}
                className="text-xl"
                >
                🔔
                </button>
            )}

        <h1 className="font-bold text-lg text-[#FFFFFF]">{patientName || user?.email || ""}</h1>


            </div>
    </header>
  )
}
