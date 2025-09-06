'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientAuthModal({ isOpen, onClose, onSuccess }: ClientAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          toast.success('Login successful!');
          onSuccess();
          onClose();
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account/profile`
          }
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          toast.success('Account created! Please check your email to verify your account.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/profile?reset=true`
      });

      if (error) {
        throw error;
      }

      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-[#16213e] rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Join us on your spiritual journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-[#16213e] border-[#0a0a23] text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-[#16213e] border-[#0a0a23] text-white pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleForgotPassword}
                className="text-[#ffd700] hover:text-[#ffd700]/80 p-0 h-auto"
              >
                Forgot password?
              </Button>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </div>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#ffd700] hover:text-[#ffd700]/80 p-0 h-auto"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Button>
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
