
import React, { useState } from 'react';
import AuthForm from './AuthForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex w-full relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-400/8 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-400/8 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-indigo-400/8 rounded-full blur-3xl floating-animation" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 sm:w-64 sm:h-64 bg-teal-400/6 rounded-full blur-3xl floating-animation" style={{ animationDelay: '6s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-40 h-40 sm:w-56 sm:h-56 bg-purple-400/6 rounded-full blur-3xl floating-animation" style={{ animationDelay: '8s' }}></div>
      </div>

      {/* Main Auth Form */}
      <div className="flex-1 flex items-center justify-center">
        <AuthForm isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
      </div>
    </div>
  );
}
