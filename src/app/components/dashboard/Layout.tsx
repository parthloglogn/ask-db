'use client';

import { useState } from 'react';
import Header from './Header';
import SidebarItem from './Sidebar';
import CredentialPanel from './CredentialPanel';
import ApiKeyPanel from './ApiKeysPanel';
import DatabaseConfigsPanel from './DatabaseConfigsPanel';
import AgentPanel from './AgentPanel'

const tabs = [
  { icon: 'LayoutDashboard', label: 'Database Configs' },
  { icon: 'LockIcon', label: 'Credentials' },
  { icon: 'Bot', label: 'Agents' },
  { icon: 'KeyRound', label: 'API Keys' },
  { icon: 'Settings', label: 'Settings' },
];

export default function Layout() {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('Database Configs');

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'Database Configs':
        return <DatabaseConfigsPanel />;
      case 'Credentials':
        return <CredentialPanel />;
      case 'API Keys':
        return <ApiKeyPanel />;
       case 'Agents':
        return <AgentPanel />;
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
            {activeTab} Page Under Construction 🛠️
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <Header onToggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        {isSidebarVisible && (
          <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col space-y-1">
            {tabs.map((tab) => (
              <SidebarItem
                key={tab.label}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.label}
                onClick={() => setActiveTab(tab.label)}
              />
            ))}
          </aside>
        )}

        <main className="flex-1 overflow-auto">{renderPanel()}</main>
      </div>
    </div>
  );
}
