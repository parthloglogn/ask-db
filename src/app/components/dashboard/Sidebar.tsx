'use client';

import {
  LayoutDashboard,
  LockIcon,
  Bot,
  KeyRound,
  Settings,
  LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  LockIcon,
  Bot,
  KeyRound,
  Settings,
};

export default function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Icon = icons[icon];

  const baseClasses = 'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all';
  const activeClasses = 'bg-gray-800 text-white';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : ''}`}
    >
      <Icon size={18} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
