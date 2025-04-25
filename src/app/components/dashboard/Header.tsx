"use client";

import Image from "next/image";
import { useState } from "react";
import { MenuIcon, XIcon, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggleSidebar();
  };

  const handleLogout = () => {
    signOut(); // optionally pass { callbackUrl: "/login" }
  };

  return (
    <header className="w-full bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-md z-50 animate-slideDown">

      {/* Left section - Logo and Sidebar Toggle */}
      <div className="flex items-center space-x-4">
        <Image
                  src="/images/ask_db_logo.png"
                  alt="logo"
                  width={140}
                  height={28}
                  className="w-full logo-animation transition-transform duration-300 hover:scale-105"
                />
        <button
          onClick={handleToggle}
          className="text-gray-300 hover:text-white transition-all p-2 rounded-md border border-gray-700 hover:bg-gray-800 focus:outline-none hover:scale-105 active:scale-95 transform"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {/* Right section - Logout Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-700 px-4 py-2 rounded-md hover:opacity-90 shadow-md transition-all duration-200 focus:outline-none hover:shadow-red-500/40 hover:scale-105 transform"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
