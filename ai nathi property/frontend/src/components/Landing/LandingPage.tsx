import React from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart, TrendingUp, Lightbulb, Calculator, Play, Sparkles, ArrowRight, Star, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import LiveChatDemo from './LiveChatDemo';

interface LandingPageProps {
  onStartChat: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onPricing?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat, onSignIn, onSignUp, onPricing }) => {
  // Animation variants for framer-motion
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const features = [
    {
      icon: BarChart,
      title: "Portfolio Analytics",
      desc: "Comprehensive insights into your property performance and revenue optimization."
    },
    {
      icon: TrendingUp,
      title: "Market Intelligence",
      desc: "Real-time pricing data and occupancy trends for strategic decision making."
    },
    {
      icon: Lightbulb,
      title: "AI Recommendations",
      desc: "Smart suggestions powered by machine learning for maximum profitability."
    },
    {
      icon: Calculator,
      title: "ROI Optimization",
      desc: "Advanced calculations and forecasting for investment success."
    }
  ];

  const testimonials = [
    { name: "Sarah Chen", role: "Property Intelligence Manager", content: "Nathi transformed how I manage my 15 properties. Revenue up 40%." },
    { name: "Mike Rodriguez", role: "Real Estate Investor", content: "The AI insights are game-changing. Best investment I've made." },
    { name: "Emma Thompson", role: "Airbnb Host", content: "Finally, a tool that actually understands the market dynamics." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
      <div className="fixed inset-0 bg-grid opacity-20"></div>
      
      {/* Header */}
      <motion.header 
        className="relative z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    HostTrack
                  </h1>
                  <p className="text-gray-600 text-sm font-medium">
                    Smart Portfolio Manager
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <button 
                className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                onClick={onPricing}
              >
                Pricing
              </button>
              <Button variant="outline" onClick={onSignIn} className="btn-outline-modern">
                Sign In
              </Button>
              <Button onClick={onSignUp} className="btn-gradient">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-start justify-center px-4 relative overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-20 left-10 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-30"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-25"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-200 rounded-full blur-3xl opacity-20"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm mb-8"
            >
              <Star className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Trusted by 500+ Property Intelligence Professionals</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-tight">
              <span className="gradient-text">Nathi</span>
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl text-gray-600 font-light">
                AI Property Intelligence
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl">
              Transform your property portfolio with AI-powered insights, real-time market data, and intelligent automation. Try Nathi live below!
            </p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Button onClick={onSignUp} className="btn-gradient text-lg px-8 py-6 group">
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" onClick={onStartChat} className="btn-outline-modern text-lg px-8 py-6 group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Visual - Live Nathi Chat Demo */}
          <motion.div 
            className="hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="relative">
              {/* Live Chat Demo */}
              <LiveChatDemo />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Everything You Need to
              <span className="gradient-text block">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful AI-driven tools designed for property investors, Airbnb hosts, and real estate professionals.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover-lift hover-glow h-full">
                    <CardContent className="p-8 h-full flex flex-col">
                      <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed flex-grow">
                        {feature.desc}
                      </p>
                      <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Trusted by <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of property managers who have transformed their business with Nathi.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 hover-lift hover:shadow-md"
              >
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 text-lg mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-200 shadow-sm rounded-3xl p-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Ready to <span className="gradient-text">Transform</span> Your Portfolio?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join thousands of property managers who are already using AI to maximize their returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button onClick={onSignUp} className="btn-gradient text-lg px-12 py-6 group">
                <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" onClick={onStartChat} className="btn-outline-modern text-lg px-12 py-6">
                <Play className="w-5 h-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">HostTrack</div>
                <div className="text-sm text-gray-600">Smart Portfolio Manager</div>
              </div>
            </div>
            
            <div className="flex space-x-8 mb-6 md:mb-0">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">About</button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">Contact</button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</button>
            </div>
            
            <p className="text-gray-500 text-sm">© 2025 AI Nathi Property Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
