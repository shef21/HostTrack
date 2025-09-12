import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Home, Upload, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { chatApi } from '../../services/api';
import { ChatMessage } from '../../types';
import { cn } from '../../lib/utils';

const ModernChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAuthenticated] = useState(false);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Free tier limits
  const FREE_TIER_MESSAGE_LIMIT = 10;

  // Session storage functions for free users
  const saveSessionMessages = (msgs: ChatMessage[]) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('nathi_session_messages', JSON.stringify(msgs));
      setSessionMessageCount(msgs.length);
    }
  };

  const loadSessionMessages = useCallback((): ChatMessage[] => {
    if (!isAuthenticated) {
      const saved = sessionStorage.getItem('nathi_session_messages');
      if (saved) {
        const msgs = JSON.parse(saved);
        setSessionMessageCount(msgs.length);
        return msgs;
      }
    }
    return [];
  }, [isAuthenticated]);

  const clearSessionMessages = () => {
    sessionStorage.removeItem('nathi_session_messages');
    setSessionMessageCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when conversationId changes or load session messages for free users
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (isAuthenticated && conversationId) {
        setIsLoadingHistory(true);
        try {
          const history = await chatApi.getConversation(conversationId);
          if (history.messages && history.messages.length > 0) {
            const formattedMessages: ChatMessage[] = history.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Error loading conversation history:', error);
        } finally {
          setIsLoadingHistory(false);
        }
      } else if (!isAuthenticated) {
        // Load session messages for free users
        const sessionMessages = loadSessionMessages();
        if (sessionMessages.length > 0) {
          setMessages(sessionMessages);
        }
      }
    };

    loadConversationHistory();
  }, [conversationId, isAuthenticated, loadSessionMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Check free tier limits
    if (!isAuthenticated && sessionMessageCount >= FREE_TIER_MESSAGE_LIMIT) {
      const upgradeMessage: ChatMessage = {
        role: 'assistant',
        content: `🚀 You've reached the free tier limit of ${FREE_TIER_MESSAGE_LIMIT} messages! Sign up for Host Track to continue our conversation and unlock unlimited AI insights, full conversation history, and advanced analytics.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, upgradeMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    // Save to session storage for free users
    if (!isAuthenticated) {
      saveSessionMessages(newMessages);
    }

    try {
      const response = await chatApi.sendMessage(inputMessage, conversationId || undefined);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      setConversationId(response.conversation_id);

      // Save to session storage for free users
      if (!isAuthenticated) {
        saveSessionMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
      
      // Save to session storage for free users
      if (!isAuthenticated) {
        saveSessionMessages(errorMessages);
      }
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
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm",
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
              <p className="text-sm text-gray-600">
                Your AI Property Intelligence
                {!isAuthenticated && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    {sessionMessageCount}/{FREE_TIER_MESSAGE_LIMIT} free messages
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {isLoadingHistory && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading conversation history...</span>
              </div>
            </div>
          )}
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
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  )}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                
                {message.role === 'assistant' && message.content.includes('Host Track') ? (
                  // Special formatting for responses with Host Track CTAs
                  <Card className="max-w-md bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-800 mb-3">
                        {message.content.split('Get detailed analytics with Host Track!')[0]}
                      </p>
                      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 border border-emerald-200">
                        <p className="text-xs font-medium text-emerald-800 mb-2">
                          🚀 Want detailed analytics for your properties?
                        </p>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
                    message.role === 'user' 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                      : "bg-white border border-gray-200 shadow-sm"
                  )}>
                    <CardContent className="p-4">
                      <p className={cn(
                        "text-sm whitespace-pre-wrap leading-relaxed",
                        message.role === 'user' ? 'text-white' : 'text-gray-800'
                      )}>
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
          {!isAuthenticated && sessionMessageCount >= FREE_TIER_MESSAGE_LIMIT ? (
            <div className="text-center py-4">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🚀 Ready for Unlimited AI Insights?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You've used all {FREE_TIER_MESSAGE_LIMIT} free messages. Upgrade to Host Track for unlimited conversations, full conversation history, and advanced property analytics.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to Host Track
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearSessionMessages}
                    className="px-6 py-2"
                  >
                    Start New Session
                  </Button>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernChatInterface;
