
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
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const AI_MODELS = [
  { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', description: 'Most capable' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', description: 'Alternative AI model' },
  { value: 'anthropic/claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: 'High-quality responses' }
];

export default function SettingsModal({ isOpen, onClose, isDarkMode, onToggleTheme, selectedModel, onModelChange }: SettingsModalProps) {
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

  const handleModelChange = (model: string) => {
    setPreferredModel(model);
    onModelChange(model);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            FlowChat Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-400" />
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
              <Bot className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium">AI Model</h3>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Select AI Model</label>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="glass-input border-white/20">
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
          </div>

          {/* Theme Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-blue-400" />
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
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
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
