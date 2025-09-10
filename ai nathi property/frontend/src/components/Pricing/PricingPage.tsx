import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, BarChart, TrendingUp, Lightbulb, Calculator, ArrowRight, Sparkles, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface PricingPageProps {
  onSignUp: () => void;
  onStartChat: () => void;
  onSignIn?: () => void;
  onHome?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSignUp, onStartChat, onSignIn, onHome }) => {
  const features = [
    {
      icon: BarChart,
      title: "Portfolio Analytics",
      description: "Comprehensive insights into your property performance and revenue optimization."
    },
    {
      icon: TrendingUp,
      title: "Market Intelligence",
      description: "Real-time pricing data and occupancy trends for strategic decision making."
    },
    {
      icon: Lightbulb,
      title: "AI Recommendations",
      description: "Smart suggestions powered by machine learning for maximum profitability."
    },
    {
      icon: Calculator,
      title: "ROI Optimization",
      description: "Advanced calculations and forecasting for investment success."
    }
  ];

  const pricingPlans = [
    {
      name: "Ultimate Access",
      price: "R0",
      period: "Free for a Limited Time",
      description: "Complete property intelligence platform with all premium features",
      features: [
        "Unlimited properties",
        "Advanced analytics & reports",
        "Real-time market data & insights",
        "AI-powered recommendations",
        "Portfolio optimization tools",
        "Market trend analysis",
        "ROI calculations & forecasting",
        "Priority AI chat support",
        "Custom integrations",
        "24/7 support access"
      ],
      cta: "Get Started Free",
      popular: true,
      gradient: "from-green-500 to-emerald-600"
    }
  ];

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
                    HostTrack
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
              <button 
                className="text-muted-foreground hover:text-white transition-colors px-4 py-2"
                onClick={onHome}
              >
                Home
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

      {/* Page Header */}
      <motion.div 
        className="relative z-50 glass-header py-8"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              <span className="gradient-text">Free for a Limited Time</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get complete access to all premium features at no cost. Limited time offer - don't miss out!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex justify-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <div className="w-full max-w-md">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={staggerItem}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                <Card className={`glass-card hover-lift hover-glow h-full relative ${plan.popular ? 'ring-2 ring-primary/50' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4 fill-current" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-8 h-full flex flex-col">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground mb-6">{plan.description}</p>
                      
                      <div className="mb-6">
                        <div className="text-5xl font-black text-white mb-2">{plan.price}</div>
                        <div className="text-muted-foreground text-lg">{plan.period}</div>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full btn-gradient group-hover:scale-105 transition-transform`}
                      onClick={onSignUp}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Why Choose <span className="gradient-text">HostTrack</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful AI-driven tools designed specifically for property investors and real estate professionals.
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
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to <span className="gradient-text">Transform</span> Your Portfolio?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of property professionals who are already using our free AI platform to maximize their returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button onClick={onSignUp} className="btn-gradient text-lg px-12 py-6 group">
                <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" onClick={onStartChat} className="btn-outline-modern text-lg px-12 py-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
