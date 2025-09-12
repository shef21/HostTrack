import React from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart, TrendingUp, Lightbulb, Calculator, Play, Sparkles, ArrowRight, Star, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import HeroChatSection from './HeroChatSection';

interface LandingPageProps {
  onStartChat: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onPricing?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat, onSignIn, onSignUp, onPricing }) => {
  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
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
    <div className="relative z-10 min-h-screen bg-gray-200 text-gray-900">
      {/* Hero Section with Chat Interface */}
      <HeroChatSection onSignUp={onSignUp} onSignIn={onSignIn} />

      {/* Features Grid Section */}
      <section id="features" className="py-32 px-4 relative bg-gray-100">
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
                  <Card className="bg-gray-200 border border-gray-400 shadow-sm hover:shadow-md hover-lift hover-glow h-full">
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
      <section className="py-32 px-4 relative bg-gray-200">
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
                className="bg-gray-100 border border-gray-400 shadow-sm rounded-3xl p-8 hover-lift hover:shadow-md"
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

      {/* About Us Section */}
      <section id="about" className="relative z-20 py-20 px-4 bg-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              About <span className="gradient-text">AI Nathi</span>
            </h2>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto">
              Real-time market data. AI insights. Better returns. AI Nathi helps hosts and investors set smarter prices, increase occupancy, and scale portfolios with confidence—powered by HostTrack.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                To empower property investors and hosts with cutting-edge AI technology that provides 
                real-time market insights, automated optimization, and intelligent decision-making tools.
              </p>
              <p className="text-gray-600">
                Built by property professionals, for property professionals. We understand the challenges 
                you face and have created solutions that actually work in the real world.
              </p>
            </motion.div>
            
            <motion.div
              className="bg-gray-100 rounded-2xl p-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                  Real-time market data integration
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                  AI-powered insights and recommendations
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                  Proven results for property investors
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                  24/7 support and guidance
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-20 py-20 px-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform your property portfolio? Let's discuss how AI Nathi can help you succeed.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, margin: "-100px" }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-emerald-600 font-bold">📧</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">hello@ainathi.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-emerald-600 font-bold">📱</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">+27 21 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-emerald-600 font-bold">📍</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Location</p>
                    <p className="text-gray-600">Cape Town, South Africa</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="bg-gray-200 rounded-2xl p-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, margin: "-100px" }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea 
                  placeholder="Your Message" 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <button className="w-full btn-gradient text-white py-3 rounded-xl font-semibold">
                  Send Message
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative bg-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gray-200 border border-gray-400 shadow-sm rounded-3xl p-12"
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
      <footer className="relative z-20 py-16 px-4 border-t border-gray-400 bg-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">HostTrack</div>
                  <div className="text-sm text-gray-700">Smart Portfolio Manager</div>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed max-w-md">
                Transform your property portfolio with AI-powered insights, real-time market data, and intelligent automation. 
                The future of property management is here.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Features</button></li>
                <li><button onClick={onPricing} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Pricing</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">About Us</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Contact</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Help Center</button></li>
                <li><button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Documentation</button></li>
                <li><button onClick={() => window.open('mailto:hello@ainathi.com?subject=Privacy Policy Inquiry', '_blank')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Privacy Policy</button></li>
                <li><button onClick={() => window.open('mailto:hello@ainathi.com?subject=Terms of Service Inquiry', '_blank')} className="text-gray-700 hover:text-gray-900 transition-colors text-sm">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-400 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
                <p className="text-gray-700 text-sm">© 2025 AI Nathi Property Intelligence. All rights reserved.</p>
                <p className="text-gray-700 text-sm">Powered by <span className="font-semibold text-emerald-600">HostTrack</span> 2025</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">Made with ❤️ in South Africa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
