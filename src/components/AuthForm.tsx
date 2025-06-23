
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AuthFormProps {
  isLogin: boolean;
  onToggle: () => void;
}

export default function AuthForm({ isLogin, onToggle }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email to verify your account.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="glass-panel p-8 sm:p-10 w-full max-w-md mx-auto transform transition-all duration-300 hover:scale-[1.02]">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-3">
              {isLogin ? 'Welcome Back' : 'Join FlowChat'}
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mx-auto"></div>
          </div>
          <p className="text-muted-foreground text-lg">
            {isLogin ? 'Continue your AI conversations' : 'Start your journey with AI'}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full glass-input pl-12 pr-4 py-4 text-lg transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10"
                  required
                />
              </div>
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-200" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-12 pr-4 py-4 text-lg transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10"
                required
              />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-200" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-12 pr-14 py-4 text-lg transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors duration-200 p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                isLogin ? 'Sign In to FlowChat' : 'Create Account'
              )}
            </Button>
          </div>
        </form>

        {/* Toggle Section */}
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-muted-foreground mb-3">
            {isLogin ? "New to FlowChat?" : 'Already have an account?'}
          </p>
          <button
            onClick={onToggle}
            className="text-blue-400 hover:text-cyan-400 font-medium transition-all duration-200 hover:scale-105 underline underline-offset-4 decoration-2 decoration-blue-400/50 hover:decoration-cyan-400/50"
          >
            {isLogin ? 'Create a new account' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}
