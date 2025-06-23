
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import AuthPage from '@/components/AuthPage';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Apply theme class to document
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show main app if user is logged in
  return (
    <div className="min-h-screen flex w-full relative overflow-hidden">
      {/* Improved Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-400/8 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-400/8 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-indigo-400/8 rounded-full blur-3xl floating-animation" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 sm:w-64 sm:h-64 bg-teal-400/6 rounded-full blur-3xl floating-animation" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Mobile Sidebar Toggle Button - Better positioned */}
      <Button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden glass-panel bg-white/8 hover:bg-white/12 border-white/15 backdrop-blur-md"
        size="icon"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'lg:ml-80'} mobile-main-content`}>
        <ChatInterface isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      </div>
    </div>
  );
};

export default Index;
