import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Home, TrendingUp, Upload, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { chatApi } from '../../services/api';
import { ChatMessage } from '../../types';
import { cn } from '../../lib/utils';

const ModernChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'user',
      content: 'What are Airbnb prices like in Sea Point this week?',
      timestamp: new Date().toISOString(),
    },
    {
      role: 'assistant',
      content: 'Based on live market data, Sea Point properties are averaging R1,096/night with ratings of 4.8/5. I can see "Blue Beach Studio close to sea in Sea Point" at R1,096/night with 45 reviews. Want to see how your property compares? Get detailed analytics with Host Track!',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(inputMessage, conversationId || undefined);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(response.conversation_id);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const portfolioItems = [
    { name: 'Cape Town Market', active: true, type: 'Live Data' },
    { name: 'Sea Point Analytics', active: false, type: 'Premium' },
    { name: 'Claremont Insights', active: false, type: 'Premium' }
  ];

  const insightItems = [
    'Live Pricing (Free)',
    'Market Trends (Free)', 
    'Full Analytics (Host Track)'
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">Nathi</h1>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Portfolio Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Portfolio</h3>
              <div className="space-y-1">
                {portfolioItems.map((item, index) => (
                  <Button
                    key={index}
                    variant={item.active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3",
                      item.active && "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        item.type === 'Live Data' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      )}>
                        {item.type}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Insights Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Insights</h3>
              <div className="space-y-1">
                {insightItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{item.split(' (')[0]}</span>
                      {item.includes('Host Track') && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          Upgrade
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapse Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-center"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                Chat with Nathi
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </h2>
              <p className="text-sm text-gray-600">Your AI Property Intelligence</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  "flex items-start space-x-3 max-w-3xl",
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                )}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={cn(
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  )}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                
                {message.role === 'assistant' && message.content.includes('Host Track') ? (
                  // Special formatting for responses with Host Track CTAs
                  <Card className="max-w-md">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700 mb-3">
                        {message.content.split('Get detailed analytics with Host Track!')[0]}
                      </p>
                      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 border border-emerald-200">
                        <p className="text-xs font-medium text-emerald-800 mb-2">
                          🚀 Want detailed analytics for your properties?
                        </p>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          Upgrade to Host Track
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className={cn(
                    "max-w-md",
                    message.role === 'user' && "bg-emerald-600 text-white border-emerald-600"
                  )}>
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <p className={cn(
                        "text-xs mt-2",
                        message.role === 'user' ? 'text-emerald-100' : 'text-gray-500'
                      )}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-white text-gray-600 border border-gray-200">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="max-w-md">
                  <CardContent className="p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="bg-white border-t border-gray-200 p-6">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Nathi about your rentals, pricing, or valuations..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Upload className="w-5 h-5" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModernChatInterface;
