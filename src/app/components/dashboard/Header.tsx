"use client";

import Image from "next/image";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react"; // lucide icons
import { signOut } from "next-auth/react"; 

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggleSidebar();
  };
    const handleLogout = () => {
      signOut(); // optionally, you can pass { callbackUrl: "/login" }
    };

  return (
  <header className="w-full bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
    <div className="flex items-center space-x-2">
      {/* <Image src="/flowwise-logo.png" alt="Flowwise Logo" width={32} height={32} /> */}
      <span className="text-white text-xl font-semibold">ASK-DB</span>
    </div>

    <div className="flex items-center space-x-4">
      <button
        onClick={handleToggle}
        className="text-gray-300 hover:text-white transition-all p-2 rounded-md border border-gray-700 hover:bg-gray-800"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      <button
        onClick={handleLogout}
        className="text-gray-300 hover:text-white transition-all p-2 rounded-md border border-gray-700 hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  </header>
);
}