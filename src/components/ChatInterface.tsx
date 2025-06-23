import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <div className="fixed inset-0 flex flex-col bg-transparent overflow-hidden">
      {/* Header - Fixed at top with better positioning */}
      <div className="mobile-header glass-panel mx-3 mt-3 p-3 sm:mx-4 sm:mt-4 sm:p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Bot className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent truncate">
            FlowChat
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="glass-input hover:bg-white/10 w-10 h-10"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="glass-input hover:bg-white/10 w-10 h-10"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Flexible height with better text wrapping */}
      <div className="flex-1 mx-3 min-h-0 sm:mx-4 pb-2">
        <div className="glass-panel h-full flex flex-col">
          <ScrollArea className="flex-1 p-3 sm:p-4">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {displayMessages.length === 0 && !currentChatId && (
                  <div className="text-center text-muted-foreground py-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-50 text-blue-400" />
                    <h3 className="text-lg font-medium mb-2">Welcome to FlowChat!</h3>
                    <p className="text-base">Start a conversation by typing a message below.</p>
                    <p className="text-sm mt-2 opacity-75">Powered by advanced AI technology</p>
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
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                        : 'bg-gradient-to-r from-indigo-500 to-blue-500'
                    }`}>
                      {message.isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    <div className={`max-w-[80%] p-3 sm:p-4 ${
                      message.isUser ? 'message-bubble-user' : 'message-bubble-ai'
                    }`}>
                      <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
                        {message.isUser ? (
                          <span className="whitespace-pre-wrap">{message.content}</span>
                        ) : (
                          <MessageRenderer content={message.content} isDarkMode={isDarkMode} />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {!message.isUser && message.model && (
                          <span>{AI_MODELS.find(m => m.value === message.model)?.label || message.model}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start space-x-3 slide-in-left">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-500">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="message-bubble-ai p-3 sm:p-4 max-w-[80%]">
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
      </div>

      {/* Input Area - Fixed at bottom with aligned height */}
      <div className="mobile-input-area mx-3 mb-3 sm:mx-4 sm:mb-4 flex-shrink-0">
        <div className="glass-panel p-3 neon-glow">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full glass-input resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-400 text-sm h-12 max-h-32 leading-tight py-3 px-4 overflow-y-auto"
                rows={1}
                disabled={isTyping}
                style={{ lineHeight: '1.5' }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-12 w-12 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 p-0"
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
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
