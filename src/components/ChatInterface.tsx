
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SettingsModal from './SettingsModal';
import MessageRenderer from './MessageRenderer';

interface ChatInterfaceProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const AI_MODELS = [
  { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', description: 'Most capable' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', description: 'Alternative AI model' },
  { value: 'anthropic/claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: 'High-quality responses' }
];

export default function ChatInterface({ isDarkMode, onToggleTheme }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, currentChatId, createChat, addMessage, loading, updateChat } = useChats();
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChatTitle = async (firstMessage: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: `Generate a short, descriptive title (max 5 words) for a conversation that starts with: "${firstMessage}". Only return the title, nothing else.`,
          model: 'openai/gpt-3.5-turbo'
        }
      });

      if (error) throw error;
      return data.response?.trim() || 'New Chat';
    } catch (error) {
      console.error('Error generating chat title:', error);
      return 'New Chat';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isTyping) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    let chatId = currentChatId;
    let isNewChat = false;
    
    try {
      console.log('Starting message send process...');
      
      // Create new chat if none exists
      if (!chatId) {
        console.log('Creating new chat...');
        const newChat = await createChat('New Chat');
        if (!newChat) {
          toast.error('Failed to create new chat');
          return;
        }
        chatId = newChat.id;
        isNewChat = true;
      }

      // Add user message
      console.log('Adding user message to database...');
      await addMessage(chatId, 'user', userMessage);

      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Calling AI API...');
      
      // Call OpenRouter API through edge function (non-streaming)
      const response = await fetch(`https://mtfifrwifpgegfynsgvp.functions.supabase.co/chat-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel,
          conversationHistory: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse = data.response;

      // Add AI response to database
      if (aiResponse) {
        console.log('Adding AI response to database...');
        await addMessage(chatId, 'assistant', aiResponse, selectedModel);
      }

      // Generate and update chat title for new chats
      if (isNewChat) {
        try {
          console.log('Generating chat title...');
          const title = await generateChatTitle(userMessage);
          await updateChat(chatId, { title });
        } catch (titleError) {
          console.error('Failed to generate chat title:', titleError);
        }
      }

      console.log('Message processing completed successfully');

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      
      // Add error message to chat if chat exists
      if (chatId) {
        await addMessage(chatId, 'assistant', 'Sorry, I encountered an error processing your request. Please try again.', selectedModel);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Convert database messages to display format
  const displayMessages = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    isUser: msg.role === 'user',
    timestamp: new Date(msg.created_at),
    model: msg.model
  }));

  return (
    <div className="flex flex-col h-screen bg-transparent">
      {/* Header */}
      <div className="glass-panel mx-2 sm:mx-4 mt-2 sm:mt-4 p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          {/* Mobile sidebar toggle */}
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden glass-input bg-white/10 hover:bg-white/20 border-white/20 p-2"
            size="icon"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center space-x-2 min-w-0">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
              AI Chat Assistant
            </h1>
          </div>
          
          {/* Model selector - hidden on very small screens */}
          <div className="hidden sm:block">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-32 sm:w-48 glass-input border-white/20 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/20">
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs sm:text-sm">{model.label}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="glass-input hover:bg-white/10 w-8 h-8 sm:w-10 sm:h-10"
          >
            {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="glass-input hover:bg-white/10 w-8 h-8 sm:w-10 sm:h-10"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Model selector for mobile */}
      <div className="sm:hidden mx-2 mb-2">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full glass-input border-white/20 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-panel border-white/20">
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{model.label}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 mx-2 sm:mx-4 mb-2 sm:mb-4">
        <ScrollArea className="h-full glass-panel p-3 sm:p-6">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {displayMessages.length === 0 && !currentChatId && (
                <div className="text-center text-muted-foreground py-8 sm:py-12">
                  <Bot className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">Welcome to AI Chat!</h3>
                  <p className="text-sm sm:text-base">Start a conversation by typing a message below.</p>
                  <p className="text-xs sm:text-sm mt-2">Powered by OpenRouter with {AI_MODELS.find(m => m.value === selectedModel)?.label}</p>
                </div>
              )}
              
              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 sm:space-x-3 ${
                    message.isUser 
                      ? 'flex-row-reverse space-x-reverse slide-in-right' 
                      : 'slide-in-left'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}>
                    {message.isUser ? (
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                  
                  <div className={`max-w-[85%] sm:max-w-3xl p-3 sm:p-4 ${
                    message.isUser ? 'message-bubble-user' : 'message-bubble-ai'
                  }`}>
                    <div className="text-xs sm:text-sm leading-relaxed">
                      {message.isUser ? (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      ) : (
                        <MessageRenderer content={message.content} isDarkMode={isDarkMode} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {!message.isUser && message.model && (
                        <p className="text-xs text-muted-foreground">
                          {AI_MODELS.find(m => m.value === message.model)?.label || message.model}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-2 sm:space-x-3 slide-in-left">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="message-bubble-ai p-3 sm:p-4 max-w-[85%] sm:max-w-3xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="mx-2 sm:mx-4 mb-4 sm:mb-6">
        <div className="glass-panel p-3 sm:p-4 neon-glow">
          <div className="flex items-end space-x-2 sm:space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full glass-input resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400 text-sm sm:text-base"
                rows={1}
                style={{
                  minHeight: '40px',
                  maxHeight: '120px',
                }}
                disabled={isTyping}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}
