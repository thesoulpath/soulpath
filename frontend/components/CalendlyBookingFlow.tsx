'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  Star,
  Package,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PhoneVerificationModal } from './modals/PhoneVerificationModal';

interface Package {
  id: number;
  name: string;
  description: string;
  sessionsCount: number;
  price: number;
  currency: string;
  duration: number;
  isPopular?: boolean;
  featured?: boolean;
}

interface ScheduleSlot {
  id: number;
  date: string;
  time: string;
  isAvailable: boolean;
  capacity?: number;
  bookedCount?: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
  isActive?: boolean;
  requiresConfirmation?: boolean;
  autoAssignPackage?: boolean;
}

interface BookingData {
  packageId?: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  selectedDate: string;
  selectedTime: string;
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  birthPlace?: string;
  message: string;
  paymentMethodId?: number;
}

interface CalendlyBookingFlowProps {
  t: Record<string, string | Record<string, string>>;
  language: string;
}

const STEPS = [
  { id: 1, title: 'Package', icon: Package },
  { id: 2, title: 'Personal Info', icon: User },
  { id: 3, title: 'Date', icon: Calendar },
  { id: 4, title: 'Time', icon: Clock },
  { id: 5, title: 'Birth Info', icon: Star },
  { id: 6, title: 'Payment', icon: CreditCard },
];

export function CalendlyBookingFlow({ t, language }: CalendlyBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [packages, setPackages] = useState<Package[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showAllPackages, setShowAllPackages] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Helper function to safely access nested translation properties
  const getTranslation = (path: string, fallback: string = ''): string => {
    const keys = path.split('.');
    let current: Record<string, string | Record<string, string>> | string = t;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback;
      }
    }

    return typeof current === 'string' ? current : fallback;
  };

  const [bookingData, setBookingData] = useState<BookingData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    selectedDate: '',
    selectedTime: '',
    birthDate: '',
    birthCity: '',
    message: '',
    paymentMethodId: undefined
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch packages and schedule data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch packages
        const packagesResponse = await fetch('/api/packages?active=true');
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          if (packagesData.success) {
            setPackages(packagesData.packages || []);
            setApiError(null);
          } else {
            setApiError(packagesData.message || 'Failed to load packages');
            console.error('❌ Packages API error:', packagesData);
          }
        } else {
          const errorData = await packagesResponse.json().catch(() => ({}));
          setApiError(errorData.message || `HTTP ${packagesResponse.status}: Failed to load packages`);
          console.error('❌ Packages API HTTP error:', packagesResponse.status, errorData);
        }

        // Fetch schedule slots
        const scheduleResponse = await fetch('/api/schedule-slots?available=true');
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          if (scheduleData.success) {
            setScheduleSlots(scheduleData.slots || []);
          } else {
            console.error('❌ Schedule slots API error:', scheduleData);
          }
        } else {
          console.error('❌ Schedule slots API HTTP error:', scheduleResponse.status);
        }

        // Fetch payment methods
        const paymentMethodsResponse = await fetch('/api/payment-methods');
        if (paymentMethodsResponse.ok) {
          const paymentMethodsData = await paymentMethodsResponse.json();
          if (paymentMethodsData.success) {
            setPaymentMethods(paymentMethodsData.data || []);
          } else {
            console.error('❌ Payment methods API error:', paymentMethodsData);
          }
        } else {
          console.error('❌ Payment methods API HTTP error:', paymentMethodsResponse.status);
        }
      } catch (error) {
        console.error('❌ Network error fetching data:', error);
        setApiError('Network error: Unable to connect to the server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateBookingData = (field: keyof BookingData, value: string | number) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Clear selected time when going back from time selection to date selection
      if (currentStep === 4) {
        updateBookingData('selectedTime', '');
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return bookingData.packageId;
      case 2: return bookingData.clientName && bookingData.clientEmail && bookingData.clientPhone;
      case 3: return bookingData.selectedDate; // Date selection required
      case 4: return bookingData.selectedTime; // Time selection required
      case 5: return bookingData.birthDate && bookingData.birthCity;
      case 6: return bookingData.paymentMethodId; // Payment method selection required
      default: return false;
    }
  };

  const handlePhoneVerificationSuccess = (userData: { fullName?: string; email?: string; phone?: string; birthDate?: string; birthTime?: string; birthPlace?: string }, isExistingCustomer: boolean) => {
    // Pre-fill the form with existing customer data
    setBookingData(prev => ({
      ...prev,
      clientName: userData.fullName || prev.clientName,
      clientEmail: userData.email || prev.clientEmail,
      clientPhone: userData.phone || prev.clientPhone,
      birthDate: userData.birthDate || prev.birthDate,
      birthTime: userData.birthTime || prev.birthTime,
      birthPlace: userData.birthPlace || prev.birthPlace,
    }));

    // If it's an existing customer, skip to the next step (personal info is already filled)
    if (isExistingCustomer && userData.fullName && userData.email) {
      setCurrentStep(3); // Skip to date selection
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/calendly-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          language
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available dates
  const availableDates = [...new Set(scheduleSlots
    .filter(slot => slot.isAvailable)
    .map(slot => slot.date)
    .sort()
  )];

  // Get available times for selected date
  const availableTimes = scheduleSlots
    .filter(slot => slot.date === bookingData.selectedDate && slot.isAvailable)
    .map(slot => slot.time)
    .sort();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get calendar dates for current view
  const getCalendarDates = () => {
    const today = new Date();
    const dates = [];
    
    if (viewMode === 'week') {
      // Show next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
    } else {
      // Show next 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4 pt-20 sm:pt-24 lg:pt-28">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-[#EAEAEA] text-sm">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="h-full flex items-center justify-center p-4 pt-20 sm:pt-24 lg:pt-28">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-heading text-red-400 mb-4">
              Unable to Load Packages
            </h2>
            <p className="text-[#EAEAEA]/80 mb-4">
              {apiError}
            </p>
            <p className="text-[#C0C0C0]/70 text-sm">
              This might be a temporary issue. Please try refreshing the page or contact support if the problem persists.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="h-full flex items-center justify-center p-4 pt-20 sm:pt-24 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm mx-auto"
        >
          <CheckCircle className="w-16 h-16 text-[#FFD700] mx-auto mb-6" />
          <h2 className="text-2xl font-heading text-[#EAEAEA] mb-4">
            {getTranslation('booking.successTitle', 'Booking Confirmed!')}
          </h2>
          <p className="text-[#EAEAEA]/80 mb-6">
            {getTranslation('booking.successMessage', 'You will receive a confirmation email shortly.')}
          </p>
          <Button
            onClick={() => {
              setSubmitStatus('idle');
              setCurrentStep(1);
              setBookingData({
                clientName: '',
                clientEmail: '',
                clientPhone: '',
                selectedDate: '',
                selectedTime: '',
                birthDate: '',
                birthCity: '',
                message: '',
                paymentMethodId: undefined
              });
            }}
            className="w-full bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90"
          >
            {getTranslation('booking.bookAnother', 'Book Another Session')}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full p-2 sm:p-4 lg:p-8 xl:p-12 pt-20 sm:pt-24 lg:pt-28">
      <div className={`mx-auto ${isMobile ? 'max-w-sm' : 'max-w-4xl lg:max-w-6xl xl:max-w-7xl'}`}>
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 pt-2 sm:pt-4">
          <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-heading text-[#EAEAEA] mb-2">
            {getTranslation('booking.title', 'Book Your Session')}
          </h1>
          <p className="text-[#EAEAEA]/80 text-xs sm:text-sm lg:text-lg xl:text-xl px-4">
            {getTranslation('booking.subtitle', 'Choose your cosmic journey')}
          </p>
        </div>

        {/* Progress Steps - Responsive */}
        <div className={`flex justify-between mb-6 sm:mb-8 ${isMobile ? 'px-2' : ''}`}>
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  ${isMobile ? 'w-8 h-8' : 'w-10 h-10 lg:w-12 lg:h-12'} rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-all duration-300
                  ${isActive ? 'bg-[#FFD700] text-[#0A0A23]' : 
                    isCompleted ? 'bg-[#FFD700]/20 text-[#FFD700]' : 
                    'bg-[#C0C0C0]/20 text-[#C0C0C0]/50'}
                `}>
                  {isCompleted ? (
                    <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 lg:w-6 lg:h-6'}`} />
                  ) : (
                    <Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 lg:w-6 lg:h-6'}`} />
                  )}
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} ${isActive ? 'text-[#FFD700]' : 'text-[#C0C0C0]/50'} text-center leading-tight`}>
                  {isMobile ? step.title.split(' ')[0] : step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content - Responsive Container */}
        <div className={`bg-gradient-to-br from-[#191970]/10 to-[#0A0A23]/10 rounded-xl sm:rounded-2xl border border-[#C0C0C0]/20 backdrop-blur-sm mb-4 sm:mb-6 ${isMobile ? 'p-4' : 'p-6 sm:p-8 lg:p-12 xl:p-16'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Package Selection */}
              {currentStep === 1 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className={`font-heading text-[#EAEAEA] mb-3 sm:mb-4 ${isMobile ? 'text-base' : 'text-lg lg:text-2xl xl:text-3xl'}`}>
                    {getTranslation('booking.selectPackage', 'Select a Package')}
                  </h3>
                  
                  {/* Already a customer link */}
                  <div className="text-center mb-4">
                    <button
                      onClick={() => setIsPhoneModalOpen(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium underline transition-colors"
                    >
                      Already a customer? Verify your phone number
                    </button>
                  </div>
                  
                  {/* Display packages (first 3 or all) */}
                  {packages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#C0C0C0]/70 mb-4">No packages available at the moment.</p>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-[#C0C0C0]/20 text-[#EAEAEA] hover:bg-[#191970]/10"
                      >
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
                      {(showAllPackages ? packages : packages.slice(0, 3)).map((pkg) => (
                      <motion.div
                        key={pkg.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
                          ${bookingData.packageId === pkg.id 
                            ? 'border-[#FFD700] bg-[#FFD700]/10' 
                            : 'border-[#C0C0C0]/20 hover:border-[#FFD700]/50'
                          }
                        `}
                        onClick={() => updateBookingData('packageId', pkg.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className={`font-medium text-[#EAEAEA] truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
                              {pkg.name}
                            </h4>
                            {pkg.isPopular && (
                              <span className="bg-[#FFD700] text-[#0A0A23] text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            <div className={`font-bold text-[#FFD700] ${isMobile ? 'text-base' : 'text-lg'}`}>
                              {pkg.currency} {pkg.price}
                            </div>
                            <div className="text-xs text-[#C0C0C0]/70">
                              {pkg.sessionsCount} session{pkg.sessionsCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <p className={`text-[#EAEAEA]/80 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {pkg.description}
                        </p>
                        <div className="text-xs text-[#C0C0C0]/70 mt-2">
                          Duration: {pkg.duration} minutes
                        </div>
                      </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Show More/Less Button */}
                  {packages.length > 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center pt-2 sm:pt-4"
                    >
                      <button
                        onClick={() => setShowAllPackages(!showAllPackages)}
                        className="text-[#FFD700] hover:text-[#FFD700]/80 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2 mx-auto"
                      >
                        {showAllPackages ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            {getTranslation('booking.showLess', 'Show Less')}
                          </>
                        ) : (
                          <>
                            {getTranslation('booking.showMore', `Show More (${packages.length - 3} more)`)}
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className={`font-heading text-[#EAEAEA] mb-3 sm:mb-4 ${isMobile ? 'text-base' : 'text-lg lg:text-2xl xl:text-3xl'}`}>
                    {getTranslation('booking.personalInfo', 'Personal Information')}
                  </h3>
                  
                  <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
                    <div>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        <User className="inline w-4 h-4 mr-2" />
                        {getTranslation('booking.name', 'Full Name')} *
                      </label>
                      <Input
                        type="text"
                        value={bookingData.clientName}
                        onChange={(e) => updateBookingData('clientName', e.target.value)}
                        className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/60 h-10 sm:h-11"
                        placeholder={getTranslation('booking.namePlaceholder', 'Enter your full name')}
                      />
                    </div>

                    <div>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        <Mail className="inline w-4 h-4 mr-2" />
                        {getTranslation('booking.email', 'Email')} *
                      </label>
                      <Input
                        type="email"
                        value={bookingData.clientEmail}
                        onChange={(e) => updateBookingData('clientEmail', e.target.value)}
                        className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/60 h-10 sm:h-11"
                        placeholder={getTranslation('booking.emailPlaceholder', 'Enter your email')}
                      />
                    </div>

                    <div className={isMobile ? '' : 'lg:col-span-2'}>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        <Phone className="inline w-4 h-4 mr-2" />
                        {getTranslation('booking.phone', 'Phone Number')} *
                      </label>
                      <Input
                        type="tel"
                        value={bookingData.clientPhone}
                        onChange={(e) => updateBookingData('clientPhone', e.target.value)}
                        className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/60 h-10 sm:h-11"
                        placeholder={getTranslation('booking.phonePlaceholder', 'Enter your phone number')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Date Selection */}
              {currentStep === 3 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className={`font-heading text-[#EAEAEA] ${isMobile ? 'text-base' : 'text-lg lg:text-xl'}`}>
                      {getTranslation('booking.selectDate', 'Select Date')}
                    </h3>
                    <div className="flex bg-[#191970]/10 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-2 sm:px-3 py-1 text-xs rounded transition-colors ${
                          viewMode === 'week' 
                            ? 'bg-[#FFD700] text-[#0A0A23]' 
                            : 'text-[#C0C0C0]/70 hover:text-[#EAEAEA]'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setViewMode('month')}
                        className={`px-2 sm:px-3 py-1 text-xs rounded transition-colors ${
                          viewMode === 'month' 
                            ? 'bg-[#FFD700] text-[#0A0A23]' 
                            : 'text-[#C0C0C0]/70 hover:text-[#EAEAEA]'
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid - Responsive */}
                  <div className={`grid gap-1 sm:gap-2 mb-3 sm:mb-4 ${isMobile ? 'grid-cols-7' : 'grid-cols-7 lg:grid-cols-10 xl:grid-cols-14'}`}>
                    {getCalendarDates().map((date, index) => {
                      const dateString = date.toISOString().split('T')[0];
                      const isAvailable = availableDates.includes(dateString);
                      const isSelected = bookingData.selectedDate === dateString;
                      
                      return (
                        <motion.button
                          key={index}
                          whileHover={isAvailable ? { scale: 1.05 } : {}}
                          whileTap={isAvailable ? { scale: 0.95 } : {}}
                          onClick={() => isAvailable && updateBookingData('selectedDate', dateString)}
                          disabled={!isAvailable}
                          className={`
                            ${isMobile ? 'aspect-square text-xs' : 'aspect-square text-xs sm:text-sm'} rounded-lg font-medium transition-all duration-300
                            ${isSelected 
                              ? 'bg-[#FFD700] text-[#0A0A23]' 
                              : isAvailable 
                                ? 'bg-[#191970]/10 text-[#EAEAEA] hover:bg-[#FFD700]/20' 
                                : 'bg-[#C0C0C0]/5 text-[#C0C0C0]/30 cursor-not-allowed'
                            }
                          `}
                        >
                          {date.getDate()}
                        </motion.button>
                      );
                    })}
                  </div>


                </div>
              )}

              {/* Step 4: Time Selection */}
              {currentStep === 4 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className={`font-heading text-[#EAEAEA] mb-3 sm:mb-4 ${isMobile ? 'text-base' : 'text-lg lg:text-2xl xl:text-3xl'}`}>
                    {getTranslation('booking.selectTime', 'Select Time')}
                  </h3>
                  
                  {/* Selected Date Display */}
                  {bookingData.selectedDate && (
                    <div className="bg-[#191970]/10 rounded-lg p-3 sm:p-4 mb-4">
                      <p className="text-[#EAEAEA] text-sm sm:text-base">
                        <Calendar className="inline w-4 h-4 mr-2" />
                        Selected Date: <span className="text-[#FFD700] font-medium">{formatDate(bookingData.selectedDate)}</span>
                      </p>
                    </div>
                  )}

                  {/* Time Selection - Responsive */}
                  {bookingData.selectedDate && (
                    <div>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        <Clock className="inline w-4 h-4 mr-2" />
                        {getTranslation('booking.selectTime', 'Select Time')}
                      </label>
                      <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
                        {availableTimes.map((time) => (
                          <motion.button
                            key={time}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateBookingData('selectedTime', time)}
                            className={`
                              p-2 sm:p-3 rounded-lg text-sm font-medium transition-all duration-300
                              ${bookingData.selectedTime === time
                                ? 'bg-[#FFD700] text-[#0A0A23]'
                                : 'bg-[#191970]/10 text-[#EAEAEA] hover:bg-[#FFD700]/20'
                              }
                            `}
                          >
                            {time}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!bookingData.selectedDate && (
                    <div className="text-center py-8">
                      <p className="text-[#C0C0C0]/70 mb-4">Please select a date first to see available times.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Birth Information */}
              {currentStep === 5 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className={`font-heading text-[#EAEAEA] mb-3 sm:mb-4 ${isMobile ? 'text-base' : 'text-lg lg:text-2xl xl:text-3xl'}`}>
                    {getTranslation('booking.birthInfo', 'Birth Information')}
                  </h3>
                  
                  <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
                    <div>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        <Calendar className="inline w-4 h-4 mr-2" />
                        {getTranslation('booking.birthDate', 'Birth Date')} *
                      </label>
                      <Input
                        type="date"
                        value={bookingData.birthDate}
                        onChange={(e) => updateBookingData('birthDate', e.target.value)}
                        className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] h-10 sm:h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        <MapPin className="inline w-4 h-4 mr-2" />
                        {getTranslation('booking.birthCity', 'Birth City')} *
                      </label>
                      <Input
                        type="text"
                        value={bookingData.birthCity}
                        onChange={(e) => updateBookingData('birthCity', e.target.value)}
                        className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/60 h-10 sm:h-11"
                        placeholder={getTranslation('booking.birthCityPlaceholder', 'Enter your birth city')}
                      />
                    </div>

                    <div className={isMobile ? '' : 'lg:col-span-2'}>
                      <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                        {getTranslation('booking.message', 'Message (Optional)')}
                      </label>
                      <Textarea
                        value={bookingData.message}
                        onChange={(e) => updateBookingData('message', e.target.value)}
                        rows={3}
                        className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] placeholder-[#C0C0C0]/60 resize-none"
                        placeholder={getTranslation('booking.messagePlaceholder', 'Tell us about your intentions for this session...')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Payment */}
              {currentStep === 6 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className={`font-heading text-[#EAEAEA] mb-3 sm:mb-4 ${isMobile ? 'text-base' : 'text-lg lg:text-2xl xl:text-3xl'}`}>
                    {getTranslation('booking.payment', 'Payment')}
                  </h3>
                  
                  {/* Booking Summary */}
                  <div className="bg-[#191970]/10 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <h4 className="font-medium text-[#EAEAEA] mb-3 text-sm sm:text-base">Booking Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#C0C0C0]/70">Package:</span>
                        <span className="text-[#EAEAEA]">
                          {packages.find(p => p.id === bookingData.packageId)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#C0C0C0]/70">Date:</span>
                        <span className="text-[#EAEAEA]">
                          {bookingData.selectedDate && formatDate(bookingData.selectedDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#C0C0C0]/70">Time:</span>
                        <span className="text-[#EAEAEA]">{bookingData.selectedTime}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#C0C0C0]/20 pt-2">
                        <span className="text-[#EAEAEA] font-medium">Total:</span>
                        <span className="text-[#FFD700] font-bold">
                          {packages.find(p => p.id === bookingData.packageId)?.currency} {packages.find(p => p.id === bookingData.packageId)?.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-[#EAEAEA] font-medium mb-2 text-sm sm:text-base">
                      <CreditCard className="inline w-4 h-4 mr-2" />
                      {getTranslation('booking.paymentMethod', 'Payment Method')} *
                    </label>
                    <Select 
                      value={bookingData.paymentMethodId?.toString()} 
                      onValueChange={(value) => updateBookingData('paymentMethodId', parseInt(value))}
                    >
                      <SelectTrigger className="bg-[#191970]/10 border-[#C0C0C0]/20 text-[#EAEAEA] h-10 sm:h-11">
                        <SelectValue placeholder={getTranslation('booking.selectPaymentMethod', 'Select payment method')}>
                          {bookingData.paymentMethodId && (() => {
                            const selectedMethod = paymentMethods.find(m => m.id === bookingData.paymentMethodId);
                            return selectedMethod ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                  {selectedMethod.icon ? (
                                    <Image
                                      src={selectedMethod.icon}
                                      alt={selectedMethod.name}
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 object-contain"
                                    />
                                  ) : (
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <span>{selectedMethod.name}</span>
                              </div>
                            ) : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="dashboard-dropdown-content">
                        {paymentMethods.length === 0 ? (
                          <SelectItem value="no-methods" disabled className="dashboard-dropdown-item">
                            No payment methods available
                          </SelectItem>
                        ) : (
                          paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id.toString()} className="dashboard-dropdown-item">
                              <div className="flex items-center space-x-3">
                                {/* Payment method icon */}
                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                  {method.icon ? (
                                    <Image
                                      src={method.icon}
                                      alt={method.name}
                                      width={24}
                                      height={24}
                                      className="w-6 h-6 object-contain"
                                      onError={(e) => {
                                        // Fallback to default icon if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  {/* Default payment icon fallback */}
                                  <CreditCard className={`w-5 h-5 text-gray-400 ${method.icon ? 'hidden' : ''}`} />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{method.name}</span>
                                  {method.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 text-center"
                    >
                      <p className="text-red-400 font-medium text-sm">
                        {getTranslation('booking.errorMessage', 'There was an error with your booking. Please try again.')}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons - Responsive */}
        <div className={`flex gap-2 sm:gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          {currentStep > 1 && (
            <Button
              onClick={prevStep}
              variant="outline"
              className={`border-[#C0C0C0]/20 text-[#EAEAEA] hover:bg-[#191970]/10 h-10 sm:h-11 ${isMobile ? 'w-full' : 'flex-1'}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {getTranslation('booking.back', 'Back')}
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed h-10 sm:h-11 ${isMobile ? 'w-full' : 'flex-1'}`}
            >
              {getTranslation('booking.next', 'Next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed h-10 sm:h-11 ${isMobile ? 'w-full' : 'flex-1'}`}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full"
                />
              ) : (
                <>
                  {getTranslation('booking.confirmBooking', 'Confirm Booking')}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onVerificationSuccess={handlePhoneVerificationSuccess}
      />
    </div>
  );
}