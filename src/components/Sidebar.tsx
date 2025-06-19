
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit3, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'Welcome Chat',
      lastMessage: 'Hello! I\'m your AI assistant...',
      timestamp: new Date(),
    },
    {
      id: '2',
      title: 'Previous Conversation',
      lastMessage: 'That was a great discussion about...',
      timestamp: new Date(Date.now() - 86400000),
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      lastMessage: 'Start a new conversation...',
      timestamp: new Date(),
    };
    setChats(prev => [newChat, ...prev]);
  };

  const handleDeleteChat = (id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, title: newTitle } : chat
    ));
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden glass-panel bg-white/10 hover:bg-white/20 border-white/20"
        size="icon"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-80 glass-panel border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-12 lg:pt-0">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Chat History
            </h2>
            <Button
              onClick={handleNewChat}
              className="glass-input hover:bg-white/10 border-white/20"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="group glass-input hover:bg-white/10 p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingId === chat.id ? (
                        <input
                          type="text"
                          defaultValue={chat.title}
                          className="w-full bg-transparent border-none outline-none text-sm font-medium"
                          autoFocus
                          onBlur={(e) => handleRenameChat(chat.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameChat(chat.id, (e.target as HTMLInputElement).value);
                            }
                          }}
                        />
                      ) : (
                        <h3 className="text-sm font-medium truncate">
                          {chat.title}
                        </h3>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {chat.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {chat.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => setEditingId(chat.id)}
                        className="w-6 h-6 p-0 hover:bg-white/10"
                        size="sm"
                        variant="ghost"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteChat(chat.id)}
                        className="w-6 h-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="glass-input p-3 text-center">
              <p className="text-xs text-muted-foreground">
                🚀 Built with Lovable
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
