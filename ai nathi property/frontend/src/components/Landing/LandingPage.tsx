import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Home, BarChart, TrendingUp, Lightbulb, Calculator, Database, Play, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface LandingPageProps {
  onStartChat: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Hero animation
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children, 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.2, 
          ease: "power2.out",
          delay: 0.2
        }
      );
    }

    // Features animation
    if (featuresRef.current) {
      gsap.fromTo(featuresRef.current.children, 
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "power2.out",
          delay: 0.8
        }
      );
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative z-10 border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Nathi Property
                  </h1>
                  <p className="text-emerald-600 text-sm font-medium">
                    Smart Portfolio Manager
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onStartChat}>
                Try Demo
              </Button>
              <Button onClick={onStartChat}>
                Start Free
              </Button>
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

        <div ref={heroRef} className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Hi, I'm <span className="text-emerald-500">Nathi</span>
              <br />
              <span className="text-3xl md:text-4xl lg:text-5xl text-gray-700">Your AI Property Manager</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
              Analyze investments, track Airbnb pricing, and optimize your rental portfolio with AI-powered insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={onStartChat} className="text-lg px-8 py-4">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Visual - Building Illustration */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Building Silhouettes */}
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="w-16 h-32 bg-gray-200 rounded-t-lg"></div>
                  <div className="w-20 h-40 bg-gray-300 rounded-t-lg"></div>
                  <div className="w-12 h-28 bg-gray-200 rounded-t-lg"></div>
                  <div className="w-24 h-36 bg-gray-300 rounded-t-lg"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-20 h-24 bg-gray-200 rounded-t-lg"></div>
                  <div className="w-16 h-32 bg-gray-300 rounded-t-lg"></div>
                  <div className="w-28 h-28 bg-gray-300 rounded-t-lg"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-12 h-20 bg-gray-200 rounded-t-lg"></div>
                  <div className="w-24 h-36 bg-gray-300 rounded-t-lg"></div>
                  <div className="w-16 h-24 bg-gray-200 rounded-t-lg"></div>
                  <div className="w-20 h-32 bg-gray-300 rounded-t-lg"></div>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Manage Your Properties</h2>
            <p className="text-xl text-gray-600">Powerful AI-driven tools for property investors and Airbnb hosts</p>
          </div>

          <div ref={featuresRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  ref={el => {
                    if (el) cardsRef.current[index] = el;
                  }}
                >
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Banner */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl text-gray-700 italic">
            "Trusted by Airbnb hosts and property managers across South Africa."
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-8 mb-4 md:mb-0">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <p className="text-gray-500 text-sm">© 2025 Host Track</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
