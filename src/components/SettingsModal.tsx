
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Palette, Bot, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  preferred_model: string;
  theme: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function SettingsModal({ isOpen, onClose, isDarkMode, onToggleTheme }: SettingsModalProps) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [preferredModel, setPreferredModel] = useState('gpt-3.5-turbo');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      loadProfile();
    }
  }, [user, isOpen]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFullName(data.full_name || '');
      setPreferredModel(data.preferred_model || 'gpt-3.5-turbo');
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          preferred_model: preferredModel,
          theme: isDarkMode ? 'dark' : 'light',
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Settings saved successfully!');
      onClose();
    } catch (error: any) {
      toast.error('Failed to save settings');
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    toast.success('Signed out successfully');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium">Profile</h3>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full glass-input px-3 py-2"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full glass-input px-3 py-2 opacity-50"
              />
            </div>
          </div>

          {/* AI Preferences */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium">AI Preferences</h3>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Preferred Model</label>
              <Select value={preferredModel} onValueChange={setPreferredModel}>
                <SelectTrigger className="glass-input border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/20">
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Theme Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium">Appearance</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Mode</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTheme}
                className="glass-input hover:bg-white/10"
              >
                {isDarkMode ? 'On' : 'Off'}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={saveProfile}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full glass-input hover:bg-red-500/20 hover:text-red-400 border-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
