'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  // Load saved email when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('soulpath_remembered_email');
      const shouldRemember = localStorage.getItem('soulpath_remember_email') === 'true';
      
      if (savedEmail && shouldRemember) {
        setEmail(savedEmail);
        setRememberEmail(true);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const success = await onLogin(email, password);
      
      if (success) {
        // Save email if remember option is checked
        if (rememberEmail) {
          localStorage.setItem('soulpath_remembered_email', email);
          localStorage.setItem('soulpath_remember_email', 'true');
        } else {
          localStorage.removeItem('soulpath_remembered_email');
          localStorage.removeItem('soulpath_remember_email');
        }
        
        toast.success('Login successful!');
        handleClose();
      } else {
        toast.error('Invalid credentials');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setLoading(false);
    // Don't reset rememberEmail state when closing
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      variant="default"
    >
      <BaseModal.Header icon={<User className="w-5 h-5" />}>
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] text-sm">
            Enter your credentials to continue
          </p>
        </div>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm">
              Email
            </Label>
            <BaseInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@soulpath.lat"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white text-sm">
              Password
            </Label>
            <div className="relative">
              <BaseInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pr-10"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[var(--color-text-secondary)] hover:text-[#FFD700] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>
          </div>

          {/* Remember Email Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              id="rememberEmail"
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="w-4 h-4 text-[#FFD700] bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] rounded focus:ring-[#FFD700] focus:ring-2"
            />
            <Label 
              htmlFor="rememberEmail" 
              className="text-sm text-[var(--color-text-secondary)] cursor-pointer select-none"
            >
              Remember my email address
            </Label>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            size="login"
            loading={loading}
            className="w-full mt-6 relative overflow-hidden group"
          >
            <span className="relative z-10 font-bold text-lg tracking-wide">
              {loading ? 'Signing In...' : 'Sign In'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFD700]/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </BaseButton>
        </form>
      </BaseModal.Content>
    </BaseModal>
  );
};

export default LoginModal;