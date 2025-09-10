import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ModernChatInterface from '../Chat/ModernChatInterface';
import MemoryManager from '../MemoryManager';
import LandingPage from '../Landing/LandingPage';
import Dashboard from '../Dashboard/Dashboard';
import AuthPage from '../Auth/AuthPage';
import { cn } from '../../lib/utils';

type TabType = 'landing' | 'chat' | 'memory' | 'analytics' | 'settings' | 'auth';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading } = useAuth();

  // GSAP animations
  useEffect(() => {
    if (mainContentRef.current) {
      gsap.fromTo(mainContentRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  const handleSignIn = () => {
    setActiveTab('auth');
  };

  const handleSignUp = () => {
    setActiveTab('auth');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'auth':
        return <AuthPage />;
      case 'chat':
        return <ModernChatInterface />;
      case 'memory':
        return <MemoryManager />;
      case 'analytics':
        return <Dashboard />;
      case 'settings':
        return <div className="p-6">Settings Coming Soon...</div>;
      default:
        return <LandingPage 
          onStartChat={() => setActiveTab('chat')} 
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />;
    }
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Show auth page if not authenticated and trying to access protected routes
  if (!isAuthenticated && ['chat', 'memory', 'analytics', 'settings'].includes(activeTab)) {
    return <AuthPage />;
  }

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
