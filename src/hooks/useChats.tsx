
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  created_at: string;
}

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Load chats when user changes
  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [user]);

  // Load messages when current chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  const loadChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error: any) {
      toast.error('Failed to load chats');
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error('Failed to load messages');
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (title: string = 'New Chat') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{ title, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setChats(prev => [data, ...prev]);
      setCurrentChatId(data.id);
      return data;
    } catch (error: any) {
      toast.error('Failed to create chat');
      console.error('Error creating chat:', error);
      return null;
    }
  };

  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update(updates)
        .eq('id', chatId);

      if (error) throw error;
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, ...updates } : chat
      ));
    } catch (error: any) {
      toast.error('Failed to update chat');
      console.error('Error updating chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error: any) {
      toast.error('Failed to delete chat');
      console.error('Error deleting chat:', error);
    }
  };

  const addMessage = async (chatId: string, role: 'user' | 'assistant', content: string, model?: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ chat_id: chatId, role, content, model }])
        .select()
        .single();

      if (error) throw error;
      
      setMessages(prev => [...prev, data]);
      
      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
      
      return data;
    } catch (error: any) {
      toast.error('Failed to save message');
      console.error('Error adding message:', error);
      return null;
    }
  };

  return {
    chats,
    currentChatId,
    messages,
    loading,
    setCurrentChatId,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
    loadChats,
  };
};
