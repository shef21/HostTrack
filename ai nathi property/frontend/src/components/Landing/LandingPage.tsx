import React from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart, TrendingUp, Lightbulb, Calculator, Play, Sparkles, ArrowRight, Star, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface LandingPageProps {
  onStartChat: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat, onSignIn, onSignUp }) => {
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
    { name: "Sarah Chen", role: "Property Manager", content: "Nathi transformed how I manage my 15 properties. Revenue up 40%." },
    { name: "Mike Rodriguez", role: "Real Estate Investor", content: "The AI insights are game-changing. Best investment I've made." },
    { name: "Emma Thompson", role: "Airbnb Host", content: "Finally, a tool that actually understands the market dynamics." }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh bg-grid opacity-30"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5"></div>
      
      {/* Header */}
      <motion.header 
        className="relative z-50 glass-header"
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
                  <h1 className="text-2xl font-bold text-white">
                    AI Nathi Property
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium">
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
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl opacity-20"
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
            className="absolute bottom-20 right-10 w-40 h-40 gradient-primary rounded-full blur-3xl opacity-15"
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
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 gradient-primary rounded-full blur-3xl opacity-10"
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
              className="inline-flex items-center px-4 py-2 rounded-full glass mb-8"
            >
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-muted-foreground">Trusted by 500+ Property Managers</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight">
              <span className="gradient-text">Nathi</span>
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl text-muted-foreground font-light">
                AI Property Manager
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl">
              Transform your property portfolio with AI-powered insights, real-time market data, and intelligent automation.
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

          {/* Right Visual - Modern Dashboard Preview */}
          <motion.div 
            className="hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="relative">
              {/* Main Dashboard Card */}
              <div className="glass-card rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-sm text-muted-foreground">Portfolio Dashboard</div>
                </div>
                
                {/* Chart Area */}
                <div className="space-y-4">
                  <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl flex items-end justify-between p-4">
                    {[40, 60, 35, 80, 45, 70, 55].map((height, i) => (
                      <motion.div
                        key={i}
                        className="bg-gradient-to-t from-primary to-primary/60 rounded-t-lg"
                        style={{ width: '12px', height: `${height}%` }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: 1 + i * 0.1 }}
                      />
                    ))}
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass rounded-2xl p-4">
                      <div className="text-2xl font-bold text-white">R2.4M</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <div className="text-2xl font-bold text-green-400">+23%</div>
                      <div className="text-sm text-muted-foreground">vs Last Month</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div 
                className="absolute -top-4 -right-4 w-8 h-8 gradient-primary rounded-full shadow-lg"
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute top-1/2 -left-8 w-6 h-6 gradient-primary rounded-full shadow-lg"
                animate={{ 
                  y: [0, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
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
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Everything You Need to
              <span className="gradient-text block">Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                  <Card className="glass-card hover-lift hover-glow h-full">
                    <CardContent className="p-8 h-full flex flex-col">
                      <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed flex-grow">
                        {feature.desc}
                      </p>
                      <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
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
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Trusted by <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                className="glass-card rounded-3xl p-8 hover-lift"
              >
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground text-lg mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
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
            className="glass-card rounded-3xl p-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Ready to <span className="gradient-text">Transform</span> Your Portfolio?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
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
      <footer className="py-16 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">AI Nathi Property</div>
                <div className="text-sm text-muted-foreground">Smart Portfolio Manager</div>
              </div>
            </div>
            
            <div className="flex space-x-8 mb-6 md:mb-0">
              <button className="text-muted-foreground hover:text-white transition-colors">About</button>
              <button className="text-muted-foreground hover:text-white transition-colors">Pricing</button>
              <button className="text-muted-foreground hover:text-white transition-colors">Contact</button>
              <button className="text-muted-foreground hover:text-white transition-colors">Privacy</button>
            </div>
            
            <p className="text-muted-foreground text-sm">© 2025 AI Nathi Property. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
