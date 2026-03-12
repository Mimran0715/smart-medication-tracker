"use client";
import {useState} from "react";
import Link from "next/link";

export default function Header() {
    const [open, setOpen] = useState(false);
  return (
    <header className="flex justify-between items-center p-4 bg-[#1AA1E3] border-b">
        <div className="flex items-center gap-2">
            <button
            onClick={() => setOpen(!open)}
            className="text-xl"
            >
            ❤️
            </button>
            <Link href="/dashboard">
            <h1 className="font-bold text-lg text-[#FFFFFF] cursor-pointer">
                Smart Medication Tracker
            </h1>
            </Link>
        </div>
        {open && (
        <div className="absolute top-16 left-6 bg-white border rounded shadow-md p-2">  
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
        <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 hover:bg-gray-100"
            >
            Log Out
        </Link>
        </div>
      )}
        <h1 className="font-bold text-lg text-[#FFFFFF]">Patient Name</h1>
    </header>
  )
}
