import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import ModernChatInterface from '../Chat/ModernChatInterface';
import MemoryManager from '../MemoryManager';
import LandingPage from '../Landing/LandingPage';
import Dashboard from '../Dashboard/Dashboard';
import AuthPage from '../Auth/AuthPage';
import PricingPage from '../Pricing/PricingPage';
import { cn } from '../../lib/utils';

type TabType = 'landing' | 'chat' | 'memory' | 'analytics' | 'settings' | 'auth' | 'pricing';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading } = useAuth();

  // Scroll to top on tab change and GSAP animations
  useEffect(() => {
    // Always scroll to top when changing tabs
    window.scrollTo(0, 0);
    
    if (mainContentRef.current) {
      gsap.fromTo(mainContentRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  // Ensure page loads at top on initial mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const handleSignIn = () => {
    setActiveTab('auth');
  };

  const handleSignUp = () => {
    setActiveTab('auth');
  };

  const handlePricing = () => {
    setActiveTab('pricing');
  };

  const handleHome = () => {
    setActiveTab('landing');
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
      case 'pricing':
        return <PricingPage 
          onStartChat={() => setActiveTab('chat')} 
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onHome={handleHome}
        />;
      default:
        return <LandingPage 
          onStartChat={() => setActiveTab('chat')} 
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onPricing={handlePricing}
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
    <div className="min-h-screen bg-background">
      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col">
        {/* Header - only show for authenticated pages */}
        {activeTab !== 'landing' && activeTab !== 'pricing' && (
          <Header onSearch={() => console.log('Search clicked')} />
        )}

        {/* Page Content */}
        <main 
          ref={mainContentRef}
          className={cn(
            "flex-1",
            // Allow scrolling on landing so footer is always reachable
            "overflow-auto"
          )}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
