import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import MemoryManager from './components/MemoryManager';
import { MessageCircle, Brain, Home, TrendingUp, Users, BarChart, Lightbulb, Calculator, Database, Play } from 'lucide-react';

type TabType = 'chat' | 'memory' | 'landing';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');

  const tabs = [
    { id: 'chat' as TabType, label: 'AI Chat', icon: MessageCircle, description: 'Chat with your property AI' },
    { id: 'memory' as TabType, label: 'Memory', icon: Brain, description: 'Manage your data' },
  ];

  const features = [
    {
      icon: BarChart,
      title: "Property Portfolio Analysis",
      desc: "Get a full overview of your listings, revenue, and performance."
    },
    {
      icon: TrendingUp,
      title: "Market Trend Insights",
      desc: "Stay updated on Airbnb pricing and occupancy in your area."
    },
    {
      icon: Lightbulb,
      title: "Investment Recommendations",
      desc: "AI-driven suggestions for when to raise or drop your rates."
    },
    {
      icon: Calculator,
      title: "ROI Calculations",
      desc: "Quickly calculate your property's return on investment."
    },
    {
      icon: Home,
      title: "Property Valuations",
      desc: "Estimate market value with AI-powered valuations."
    },
    {
      icon: Database,
      title: "Memory & Data Storage",
      desc: "Store your property history and enrich Nathi's intelligence."
    }
  ];

  const handleStartChat = () => {
    setActiveTab('chat');
  };

  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="glass border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      AI Nathi Property
                    </h1>
                    <p className="text-emerald-100 text-sm">
                      Smart Portfolio Manager
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setActiveTab('chat')}
                  className="text-white/80 hover:text-white transition-colors font-medium"
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className="text-white/80 hover:text-white transition-colors font-medium"
                >
                  Memory
                </button>
                <button
                  onClick={handleStartChat}
                  className="btn-emerald text-sm px-6 py-2"
                >
                  Start Free
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-emerald-400 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Hi, I'm <span className="text-emerald-400">Nathi</span>
                <br />
                <span className="text-3xl md:text-4xl lg:text-5xl text-white/90">Your AI Property Manager</span>
              </h1>
              
              <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
                Analyze investments, track Airbnb pricing, and optimize your rental portfolio with AI-powered insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleStartChat}
                  className="btn-emerald text-lg px-8 py-4"
                >
                  Start Free
                </button>
                <button className="btn-outline text-lg px-8 py-4 flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Right Visual - Building Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Building Silhouettes */}
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="w-16 h-32 bg-white/20 rounded-t-lg"></div>
                    <div className="w-20 h-40 bg-white/30 rounded-t-lg"></div>
                    <div className="w-12 h-28 bg-white/20 rounded-t-lg"></div>
                    <div className="w-24 h-36 bg-white/25 rounded-t-lg"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-20 h-24 bg-white/20 rounded-t-lg"></div>
                    <div className="w-16 h-32 bg-white/30 rounded-t-lg"></div>
                    <div className="w-28 h-28 bg-white/25 rounded-t-lg"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-12 h-20 bg-white/20 rounded-t-lg"></div>
                    <div className="w-24 h-36 bg-white/30 rounded-t-lg"></div>
                    <div className="w-16 h-24 bg-white/25 rounded-t-lg"></div>
                    <div className="w-20 h-32 bg-white/20 rounded-t-lg"></div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 -left-8 w-6 h-6 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-8 -right-8 w-4 h-4 bg-emerald-300 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Manage Your Properties</h2>
              <p className="text-xl text-white/70">Powerful AI-driven tools for property investors and Airbnb hosts</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="card p-8 hover-lift">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonial Banner */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-2xl text-white/80 italic">
              "Trusted by Airbnb hosts and property managers across South Africa."
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-8 mb-4 md:mb-0">
              <a href="#" className="text-white/70 hover:text-white transition-colors">About</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-white/50 text-sm">© 2025 Host Track</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    AI Nathi Property
                  </h1>
                  <p className="text-emerald-100 text-sm">
                    Smart Portfolio Manager
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="glass rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm font-medium">Portfolio Active</span>
                </div>
              </div>
              <div className="glass rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">AI Assistant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10"
            >
              <Home className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div>Home</div>
                <div className="text-xs opacity-75">Back to landing</div>
              </div>
            </button>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeInUp">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'memory' && <MemoryManager />}
        </div>
      </main>
    </div>
  );
}

export default App;
