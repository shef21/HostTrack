import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Sidebar from './Sidebar';
import Header from './Header';
import ModernChatInterface from '../Chat/ModernChatInterface';
import MemoryManager from '../MemoryManager';
import LandingPage from '../Landing/LandingPage';
import Dashboard from '../Dashboard/Dashboard';
import { cn } from '@/lib/utils';

type TabType = 'landing' | 'chat' | 'memory' | 'analytics' | 'settings';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useEffect(() => {
    if (mainContentRef.current) {
      gsap.fromTo(mainContentRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ModernChatInterface />;
      case 'memory':
        return <MemoryManager />;
      case 'analytics':
        return <Dashboard />;
      case 'settings':
        return <div className="p-6">Settings Coming Soon...</div>;
      default:
        return <LandingPage onStartChat={() => setActiveTab('chat')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header - only show for non-landing pages */}
          {activeTab !== 'landing' && (
            <Header onSearch={() => console.log('Search clicked')} />
          )}

          {/* Page Content */}
          <main 
            ref={mainContentRef}
            className={cn(
              "flex-1",
              activeTab === 'landing' ? "overflow-hidden" : "overflow-auto"
            )}
          >
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
