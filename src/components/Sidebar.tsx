
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit3, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { chats, currentChatId, setCurrentChatId, createChat, updateChat, deleteChat } = useChats();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleNewChat = async () => {
    if (!user) return;
    await createChat();
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const handleDeleteChat = async (id: string) => {
    await deleteChat(id);
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    if (newTitle.trim()) {
      await updateChat(id, { title: newTitle.trim() });
    }
    setEditingId(null);
  };

  const handleChatClick = (chatId: string) => {
    setCurrentChatId(chatId);
    // Close sidebar on mobile after selecting a chat
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
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
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleNewChat}
                className="glass-input hover:bg-white/10 border-white/20"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
              {/* Mobile close button */}
              <Button
                onClick={onToggle}
                className="lg:hidden glass-input hover:bg-white/10 border-white/20"
                size="sm"
                variant="ghost"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group glass-input hover:bg-white/10 p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    currentChatId === chat.id ? 'bg-white/10 border-purple-500/50' : ''
                  }`}
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingId === chat.id ? (
                        <input
                          type="text"
                          defaultValue={chat.title}
                          className="w-full bg-transparent border-none outline-none text-sm font-medium text-white"
                          autoFocus
                          onBlur={(e) => handleRenameChat(chat.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameChat(chat.id, (e.target as HTMLInputElement).value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium truncate text-white">
                          {chat.title}
                        </h3>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(chat.id);
                        }}
                        className="w-6 h-6 p-0 hover:bg-white/10"
                        size="sm"
                        variant="ghost"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
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
              
              {chats.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs">Start a new chat to begin</p>
                </div>
              )}
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
