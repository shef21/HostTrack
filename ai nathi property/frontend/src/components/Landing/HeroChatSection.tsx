import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import HeroChatInterface from '../Chat/HeroChatInterface';

interface HeroChatSectionProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

const HeroChatSection: React.FC<HeroChatSectionProps> = ({ onSignUp, onSignIn }) => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      {/* Header */}
      <motion.header 
        className="relative z-50 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800"
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
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Nathi AI
                  </h1>
                  <p className="text-neutral-400 text-sm font-medium">
                    Cape Town Property Intelligence
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
              <Button variant="ghost" onClick={onSignIn} className="text-neutral-300 hover:text-white hover:bg-neutral-800 px-6 py-2">
                Sign In
              </Button>
              <Button onClick={onSignUp} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Meet Nathi, Your Property AI.
              </h1>
              <p className="text-xl md:text-2xl text-neutral-300 mb-4 max-w-4xl mx-auto leading-relaxed">
                The only AI that knows Cape Town's property market inside out. Get instant insights on pricing, occupancy, and investment opportunities.
              </p>
              <p className="text-lg text-neutral-400 mb-8 max-w-3xl mx-auto">
                Powered by HostTrack's real-time data from 500+ properties across Sea Point, Camps Bay, and beyond.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Button 
                onClick={onSignUp} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-xl group"
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Try Nathi Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                onClick={onSignIn}
                className="border-neutral-600 text-neutral-300 hover:text-white hover:bg-neutral-800 px-8 py-4 text-lg font-semibold rounded-xl"
              >
                Access HostTrack
              </Button>
            </motion.div>
          </div>

          {/* Chat Interface Container */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="w-full max-w-6xl mx-auto"
          >
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden">
              {/* Chat Interface - Preserving all functionality */}
              <HeroChatInterface />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HeroChatSection;
