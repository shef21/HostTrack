import React from 'react';
import { Home, MessageCircle, Brain, TrendingUp, BarChart, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'landing', label: 'Home', icon: Home, description: 'Dashboard overview' },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle, description: 'Chat with Nathi' },
    { id: 'memory', label: 'Memory', icon: Brain, description: 'Manage your data' },
    { id: 'analytics', label: 'Analytics', icon: BarChart, description: 'Property insights' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Preferences' },
  ];

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nathi</h1>
              <p className="text-sm text-gray-500">Property AI</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                isActive && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                collapsed && "px-2"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
              {!collapsed && (
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
