import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { chatApi } from '../../services/api';
import { ChatMessage } from '../../types';
import { cn } from '../../lib/utils';

const HeroChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
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

  const loadSessionMessages = (): ChatMessage[] => {
    if (!isAuthenticated) {
      const saved = sessionStorage.getItem('nathi_session_messages');
      if (saved) {
        const msgs = JSON.parse(saved);
        setSessionMessageCount(msgs.length);
        return msgs;
      }
    }
    return [];
  };

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

  return (
    <div className="h-[600px] flex flex-col bg-neutral-900">
      {/* Chat Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Chat with Nathi
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </h2>
            <p className="text-sm text-neutral-400">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                "flex items-start space-x-3 max-w-2xl",
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              )}
            >
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className={cn(
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 border border-neutral-600'
                )}>
                  {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
              
              {message.role === 'assistant' && message.content.includes('Host Track') ? (
                // Special formatting for responses with Host Track CTAs
                <Card className="max-w-md bg-neutral-800 border border-neutral-700 shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-sm text-neutral-200 mb-3">
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
                    <p className="text-xs text-neutral-500 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className={cn(
                  "max-w-md",
                  message.role === 'user' 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                    : "bg-neutral-800 border border-neutral-700 shadow-sm"
                )}>
                  <CardContent className="p-3">
                    <p className={cn(
                      "text-sm whitespace-pre-wrap leading-relaxed",
                      message.role === 'user' ? 'text-white' : 'text-neutral-200'
                    )}>
                      {message.content}
                    </p>
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === 'user' ? 'text-emerald-100' : 'text-neutral-500'
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
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-neutral-700 text-neutral-300 border border-neutral-600">
                  <Bot className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <Card className="max-w-md">
                <CardContent className="p-3">
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
      <div className="bg-neutral-800 border-t border-neutral-700 p-4">
        {!isAuthenticated && sessionMessageCount >= FREE_TIER_MESSAGE_LIMIT ? (
          <div className="text-center py-4">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-200">
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
                className="w-full px-4 py-3 pr-12 bg-neutral-700 border border-neutral-600 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HeroChatInterface;
