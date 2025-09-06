'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../cms/Toast';

interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  example: string;
}

interface UserData {
  id?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  language?: string;
  status?: string;
}

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: (userData: UserData, isExistingCustomer: boolean) => void;
}

const countries: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', prefix: '+1', example: '5551234567' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', prefix: '+57', example: '3001234567' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', prefix: '+52', example: '5512345678' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', prefix: '+34', example: '612345678' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', prefix: '+1', example: '5551234567' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', prefix: '+55', example: '11987654321' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', prefix: '+54', example: '91123456789' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', prefix: '+56', example: '912345678' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', prefix: '+51', example: '912345678' },
];

export function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  onVerificationSuccess 
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setOtpSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const toast = useToast();

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Validate phone number format
    const cleanNumber = phoneNumber.trim().replace(/\D/g, '');
    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      setError('Phone number must be between 7 and 15 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          countryCode: selectedCountry.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setStep('otp');
        setTimeRemaining(60); // 60 seconds cooldown
        toast.showSuccess(
          'OTP Sent',
          `Verification code sent to ${selectedCountry.prefix} ${phoneNumber}`
        );
      } else {
        // Provide more specific error messages
        if (data.error && data.error.includes('Invalid phone number format')) {
          setError(`Invalid phone number format for ${selectedCountry.name}. Expected format: ${selectedCountry.example} (${selectedCountry.example.length} digits)`);
        } else {
          setError(data.error || 'Failed to send OTP');
        }
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const fullPhoneNumber = `${selectedCountry.prefix}${phoneNumber}`;
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          otpCode: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.showSuccess(
          'Verification Successful',
          data.isExistingCustomer 
            ? 'Welcome back! Your information has been loaded.'
            : 'Phone number verified successfully.'
        );
        
        onVerificationSuccess(data.user, data.isExistingCustomer);
        onClose();
      } else {
        setError(data.error || 'Invalid OTP code');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timeRemaining > 0) return;
    
    setOtpCode('');
    setError('');
    await handleSendOtp();
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtpCode('');
    setError('');
    setOtpSent(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-gradient-to-br from-[#191970]/95 to-[#0A0A23]/95 backdrop-blur-sm rounded-2xl border border-[#C0C0C0]/20 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#C0C0C0]/20">
            <div className="flex items-center gap-3">
              {step === 'otp' && (
                <button
                  onClick={handleBackToPhone}
                  className="p-1 hover:bg-[#191970]/20 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} className="text-[#EAEAEA]" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-[#FFD700]" />
                <h2 className="text-lg font-semibold text-[#EAEAEA]">
                  {step === 'phone' ? 'Verify Phone Number' : 'Enter Verification Code'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#191970]/20 rounded-full transition-colors"
            >
              <X size={20} className="text-[#EAEAEA]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'phone' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-[#EAEAEA]/80">
                    Enter your phone number to receive a verification code
                  </p>
                </div>

                {/* Country Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#EAEAEA]">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const country = countries.find(c => c.code === e.target.value);
                        if (country) setSelectedCountry(country);
                      }}
                      className="w-full p-3 bg-[#191970]/10 border border-[#C0C0C0]/20 text-[#EAEAEA] rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name} ({country.prefix})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#EAEAEA]">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-3 bg-[#191970]/20 border border-[#C0C0C0]/20 rounded-lg">
                      <span className="text-[#EAEAEA]">{selectedCountry.prefix}</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder={selectedCountry.example}
                      className="flex-1 p-3 bg-[#191970]/10 border border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/50 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-[#C0C0C0]/70">
                    Example: {selectedCountry.example} (without country code)
                  </p>
                  <p className="text-xs text-[#FFD700]">
                    💡 Enter only the local number, the country code {selectedCountry.prefix} will be added automatically
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-sm text-red-400">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full py-3 px-4 bg-[#FFD700] text-[#0A0A23] rounded-lg font-medium hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle size={48} className="mx-auto text-[#FFD700] mb-3" />
                  <p className="text-[#EAEAEA]/80">
                    We sent a 6-digit code to
                  </p>
                  <p className="font-medium text-[#EAEAEA]">
                    {selectedCountry.prefix} {phoneNumber}
                  </p>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#EAEAEA]">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full p-3 text-center text-2xl font-mono bg-[#191970]/10 border border-[#C0C0C0]/20 text-[#EAEAEA] rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent tracking-widest"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-sm text-red-400">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 px-4 bg-[#FFD700] text-[#0A0A23] rounded-lg font-medium hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <p className="text-sm text-[#EAEAEA]/80">
                    Didn&apos;t receive the code?{' '}
                    <button
                      onClick={handleResendOtp}
                      disabled={timeRemaining > 0}
                      className="text-[#FFD700] hover:text-[#FFD700]/80 disabled:text-[#C0C0C0]/50 disabled:cursor-not-allowed font-medium"
                    >
                      {timeRemaining > 0 ? `Resend in ${formatTime(timeRemaining)}` : 'Resend Code'}
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
