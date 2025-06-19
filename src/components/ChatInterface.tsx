
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import SettingsModal from './SettingsModal';

interface ChatInterfaceProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function ChatInterface({ isDarkMode, onToggleTheme }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, currentChatId, createChat, addMessage, loading } = useChats();
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = use

Ref<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    let chatId = currentChatId;
    
    // Create new chat if none exists
    if (!chatId) {
      const newChat = await createChat('New Chat');
      if (!newChat) return;
      chatId = newChat.id;
    }

    // Add user message
    await addMessage(chatId, 'user', inputMessage);
    const userMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with real API call later)
    setTimeout(async () => {
      const aiResponse = `I understand you said: "${userMessage}". This is a demo response from ${selectedModel}. In a real implementation, this would connect to the OpenRouter API.`;
      await addMessage(chatId!, 'assistant', aiResponse, selectedModel);
      setIsTyping(false);
    }, 2000);
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
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
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
                    <p className="text-xs text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
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
