
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SettingsModal from './SettingsModal';

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
      // Create new chat if none exists
      if (!chatId) {
        const newChat = await createChat('New Chat');
        if (!newChat) {
          toast.error('Failed to create new chat');
          return;
        }
        chatId = newChat.id;
        isNewChat = true;
      }

      // Add user message
      await addMessage(chatId, 'user', userMessage);

      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call OpenRouter API through edge function
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: userMessage,
          model: selectedModel,
          conversationHistory: conversationHistory
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response
      await addMessage(chatId, 'assistant', data.response, selectedModel);

      // Generate and update chat title for new chats
      if (isNewChat) {
        try {
          const title = await generateChatTitle(userMessage);
          await updateChat(chatId, { title });
        } catch (titleError) {
          console.error('Failed to generate chat title:', titleError);
        }
      }

      toast.success('Message sent successfully');

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
      <div className="glass-panel m-4 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Chat Assistant
            </h1>
          </div>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48 glass-input border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-white/20">
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.label}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="glass-input hover:bg-white/10"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="glass-input hover:bg-white/10"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 mx-4 mb-4">
        <ScrollArea className="h-full glass-panel p-6">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {displayMessages.length === 0 && !currentChatId && (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Welcome to AI Chat!</h3>
                  <p>Start a conversation by typing a message below.</p>
                  <p className="text-sm mt-2">Powered by OpenRouter with {AI_MODELS.find(m => m.value === selectedModel)?.label}</p>
                </div>
              )}
              
              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.isUser 
                      ? 'flex-row-reverse space-x-reverse slide-in-right' 
                      : 'slide-in-left'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}>
                    {message.isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className={`max-w-3xl p-4 ${
                    message.isUser ? 'message-bubble-user' : 'message-bubble-ai'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
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
                <div className="flex items-start space-x-3 slide-in-left">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="message-bubble-ai p-4">
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
      <div className="mx-4 mb-6">
        <div className="glass-panel p-4 neon-glow">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full glass-input resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                }}
                disabled={isTyping}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
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
