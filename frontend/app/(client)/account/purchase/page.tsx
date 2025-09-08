'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  User, 
  CheckCircle, 
  CreditCard, 
  ShoppingCart, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { StripeInlineForm } from '@/components/stripe/StripeInlineForm';
import { ChevronDown, Check } from 'lucide-react';

interface PackagePrice {
  id: number;
  price: number;
  packageDefinition: {
    id: number;
    name: string;
    description: string;
    sessionsCount: number;
    isActive: boolean;
  };
  currency: {
    id: number;
    code: string;
    symbol: string;
    name: string;
  };
}

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  autoAssignPackage: boolean;
  isActive: boolean;
}

interface PurchaseStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface PurchaseFormData {
  selectedPackage: PackagePrice | null;
  selectedPaymentMethod: PaymentMethod | null;
  quantity: number;
  notes: string;
  // Pre-loaded user data
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
  language: string;
}

export default function PurchasePage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackagePrice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);

  const [formData, setFormData] = useState<PurchaseFormData>({
    selectedPackage: null,
    selectedPaymentMethod: null,
    quantity: 1,
    notes: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    question: '',
    language: 'en'
  });

  const getSteps = (): PurchaseStep[] => [
    { id: 'package', title: 'Select Package', description: 'Choose your spiritual journey package', completed: !!formData.selectedPackage },
    { id: 'details', title: 'Review Details', description: 'Confirm your information and preferences', completed: !!formData.selectedPackage && !!formData.clientName && !!formData.clientEmail },
    { id: 'payment', title: 'Payment', description: 'Complete your purchase securely', completed: !!formData.selectedPackage && !!formData.selectedPaymentMethod }
  ];

  const loadUserProfile = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      console.log('🔍 Loading user profile...');
      const response = await fetch('/api/client/me', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const profile = data.data;
          console.log('✅ User profile loaded:', profile);
          
          // Pre-populate form with user data
          setFormData(prev => ({
            ...prev,
            clientName: profile.fullName || '',
            clientEmail: profile.email || '',
            clientPhone: profile.phone || '',
            birthDate: profile.birthDate || '',
            birthTime: profile.birthTime || '',
            birthPlace: profile.birthPlace || '',
            question: profile.question || '',
            language: profile.language || 'en'
          }));
        }
      } else {
        console.error('❌ Failed to load user profile:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    }
  }, [user?.access_token]);

  const loadPackages = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      console.log('🔍 Loading packages...');
      const response = await fetch('/api/client/packages', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Packages loaded:', data.data?.length || 0);
          setPackages(data.data || []);
        } else {
          console.error('❌ Failed to load packages:', data.message);
        }
      } else {
        console.error('❌ Failed to load packages:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading packages:', error);
    }
  }, [user?.access_token]);

  const loadPaymentMethods = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      console.log('🔍 Loading payment methods...');
      const response = await fetch('/api/client/payment-methods', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Payment methods loaded:', data.data?.length || 0);
          setPaymentMethods(data.data || []);
          
          // Auto-select Stripe as default payment method
          const stripeMethod = data.data?.find((method: PaymentMethod) => method.type === 'stripe');
          if (stripeMethod) {
            setFormData(prev => ({ ...prev, selectedPaymentMethod: stripeMethod }));
          }
        } else {
          console.error('❌ Failed to load payment methods:', data.message);
        }
      } else {
        console.error('❌ Failed to load payment methods:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
    }
  }, [user?.access_token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading all data...');
      await Promise.all([
        loadUserProfile(),
        loadPackages(),
        loadPaymentMethods()
      ]);
      console.log('✅ All data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile, loadPackages, loadPaymentMethods]);

  useEffect(() => {
    if (user?.access_token) {
      loadData();
    }
  }, [user?.access_token, loadData]);


  const handleInputChange = (field: keyof PurchaseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePackageSelect = (pkg: PackagePrice) => {
    setFormData(prev => ({ ...prev, selectedPackage: pkg }));
    setCurrentStep(1);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setFormData(prev => ({ ...prev, selectedPaymentMethod: method }));
    setShowPaymentMethodDropdown(false);
  };

  const handleQuantityChange = (quantity: number) => {
    if (quantity >= 1 && quantity <= 10) {
      setFormData(prev => ({ ...prev, quantity }));
    }
  };

  const handleNext = () => {
    const steps = getSteps();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePurchase = async () => {
    if (!formData.selectedPackage || !formData.selectedPaymentMethod) {
      toast.error('Please select a package and payment method');
      return;
    }

    setProcessing(true);
    try {
      console.log('🔍 Submitting purchase...');
      const response = await fetch('/api/client/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packagePriceId: formData.selectedPackage.id,
          paymentMethodId: formData.selectedPaymentMethod.id,
          quantity: formData.quantity,
          notes: formData.notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Purchase completed successfully!');
        // Reset form or redirect
        setTimeout(() => {
          window.location.href = '/account/my-packages';
        }, 2000);
      } else {
        toast.error(result.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('❌ Error submitting purchase:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleStripeSuccess = () => {
    toast.success('Payment successful!');
    handlePurchase();
  };

  const handleStripeError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a2e] to-[#16213e]">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Purchase Packages</h1>
          <p className="text-gray-400 text-lg">Choose your spiritual journey package and complete your purchase</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {getSteps().map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'border-[#FFD700] bg-[#FFD700] text-black' 
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3 text-left">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < getSteps().length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-600 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Package Selection */}
                {currentStep === 0 && (
                  <Card className="bg-[#1a1a2e] border-[#16213e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Package className="w-5 h-5 text-[#ffd700]" />
                        <span>Select Your Package</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {packages.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">No packages available at the moment</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {packages.map((pkg) => (
                            <Card 
                              key={pkg.id}
                              className={`cursor-pointer transition-all duration-200 ${
                                formData.selectedPackage?.id === pkg.id
                                  ? 'border-[#ffd700] bg-[#ffd700]/10'
                                  : 'border-[#16213e] hover:border-[#ffd700]/50'
                              }`}
                              onClick={() => handlePackageSelect(pkg)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-white font-semibold">{pkg.packageDefinition.name}</h3>
                                  <Badge className="bg-[#ffd700] text-black">
                                    {pkg.currency.symbol}{pkg.price}
                                  </Badge>
                                </div>
                                <p className="text-gray-400 text-sm mb-3">{pkg.packageDefinition.description}</p>
                                <div className="flex items-center justify-between text-sm text-gray-300">
                                  <span>{pkg.packageDefinition.sessionsCount} sessions</span>
                                  <span>{pkg.currency.code.toUpperCase()}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Review Details */}
                {currentStep === 1 && (
                  <Card className="bg-[#1a1a2e] border-[#16213e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <User className="w-5 h-5 text-[#ffd700]" />
                        <span>Review Your Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Selected Package */}
                      {formData.selectedPackage && (
                        <div className="bg-[#16213e] p-4 rounded-lg">
                          <h3 className="text-white font-semibold mb-2">Selected Package</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white">{formData.selectedPackage.packageDefinition.name}</p>
                              <p className="text-gray-400 text-sm">{formData.selectedPackage.packageDefinition.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[#ffd700] font-semibold">
                                {formData.selectedPackage.currency.symbol}{formData.selectedPackage.price}
                              </p>
                              <p className="text-gray-400 text-sm">per package</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quantity */}
                      <div>
                        <Label className="text-gray-300">Quantity</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <BaseButton
                            onClick={() => handleQuantityChange(formData.quantity - 1)}
                            disabled={formData.quantity <= 1}
                            className="px-3 py-1"
                          >
                            -
                          </BaseButton>
                          <span className="text-white px-4">{formData.quantity}</span>
                          <BaseButton
                            onClick={() => handleQuantityChange(formData.quantity + 1)}
                            disabled={formData.quantity >= 10}
                            className="px-3 py-1"
                          >
                            +
                          </BaseButton>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientName" className="text-gray-300">Full Name</Label>
                          <Input
                            id="clientName"
                            value={formData.clientName}
                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                            className="bg-[#16213e] border-[#0a0a23] text-white"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientEmail" className="text-gray-300">Email</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                            className="bg-[#16213e] border-[#0a0a23] text-white"
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientPhone" className="text-gray-300">Phone</Label>
                          <Input
                            id="clientPhone"
                            value={formData.clientPhone}
                            onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                            className="bg-[#16213e] border-[#0a0a23] text-white"
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="birthDate" className="text-gray-300">Birth Date</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                            className="bg-[#16213e] border-[#0a0a23] text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="birthTime" className="text-gray-300">Birth Time</Label>
                          <Input
                            id="birthTime"
                            type="time"
                            value={formData.birthTime}
                            onChange={(e) => handleInputChange('birthTime', e.target.value)}
                            className="bg-[#16213e] border-[#0a0a23] text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="birthPlace" className="text-gray-300">Birth Place</Label>
                          <Input
                            id="birthPlace"
                            value={formData.birthPlace}
                            onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                            className="bg-[#16213e] border-[#0a0a23] text-white"
                            placeholder="Enter your birth place"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="question" className="text-gray-300">Spiritual Question</Label>
                        <Textarea
                          id="question"
                          value={formData.question}
                          onChange={(e) => handleInputChange('question', e.target.value)}
                          className="bg-[#16213e] border-[#0a0a23] text-white"
                          placeholder="What would you like to explore in your spiritual journey?"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          className="bg-[#16213e] border-[#0a0a23] text-white"
                          placeholder="Any special requests or additional information..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Payment */}
                {currentStep === 2 && (
                  <Card className="bg-[#1a1a2e] border-[#16213e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-[#ffd700]" />
                        <span>Complete Payment</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Payment Method Selection */}
                      <div>
                        <Label className="text-gray-300">Payment Method</Label>
                        <div className="relative mt-1">
                          <BaseButton
                            onClick={() => setShowPaymentMethodDropdown(!showPaymentMethodDropdown)}
                            className="w-full justify-between bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                          >
                            <div className="flex items-center space-x-2">
                              {formData.selectedPaymentMethod?.icon && (
                                <img 
                                  src={formData.selectedPaymentMethod.icon} 
                                  alt={formData.selectedPaymentMethod.name}
                                  className="w-5 h-5"
                                />
                              )}
                              <span>{formData.selectedPaymentMethod?.name || 'Select payment method'}</span>
                            </div>
                            <ChevronDown className="w-4 h-4" />
                          </BaseButton>
                          
                          {showPaymentMethodDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#16213e] border border-[#0a0a23] rounded-lg shadow-lg z-10">
                              {paymentMethods.map((method) => (
                                <button
                                  key={method.id}
                                  onClick={() => handlePaymentMethodSelect(method)}
                                  className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-[#0a0a23] text-white"
                                >
                                  {method.icon && (
                                    <img src={method.icon} alt={method.name} className="w-5 h-5" />
                                  )}
                                  <div>
                                    <p className="font-medium">{method.name}</p>
                                    <p className="text-sm text-gray-400">{method.description}</p>
                                  </div>
                                  {formData.selectedPaymentMethod?.id === method.id && (
                                    <Check className="w-4 h-4 text-[#ffd700] ml-auto" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stripe Payment Form */}
                      {formData.selectedPaymentMethod?.type === 'stripe' && formData.selectedPackage && (
                        <div className="bg-[#16213e] p-4 rounded-lg">
                          <h3 className="text-white font-semibold mb-4">Secure Payment</h3>
                          <StripeInlineForm
                            amount={formData.selectedPackage.price * formData.quantity * 100}
                            currency={formData.selectedPackage.currency.code}
                            description={`Purchase of ${formData.selectedPackage.packageDefinition.name} (${formData.quantity} ${formData.quantity === 1 ? 'unit' : 'units'})`}
                            customerEmail={formData.clientEmail}
                            onSuccess={handleStripeSuccess}
                            onError={handleStripeError}
                          />
                        </div>
                      )}

                      {/* Other Payment Methods */}
                      {formData.selectedPaymentMethod?.type !== 'stripe' && (
                        <div className="bg-[#16213e] p-4 rounded-lg">
                          <h3 className="text-white font-semibold mb-4">Payment Information</h3>
                          <p className="text-gray-400 mb-4">
                            You have selected {formData.selectedPaymentMethod?.name}. 
                            Please complete your payment using the selected method.
                          </p>
                          <BaseButton
                            onClick={handlePurchase}
                            disabled={processing}
                            className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                          >
                            {processing ? 'Processing...' : 'Complete Purchase'}
                          </BaseButton>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <BaseButton
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23] disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </BaseButton>
              
              {currentStep < getSteps().length - 1 ? (
                <BaseButton
                  onClick={handleNext}
                  disabled={
                    (currentStep === 0 && !formData.selectedPackage) ||
                    (currentStep === 1 && (!formData.clientName || !formData.clientEmail))
                  }
                  className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </BaseButton>
              ) : (
                <BaseButton
                  onClick={handlePurchase}
                  disabled={!formData.selectedPackage || !formData.selectedPaymentMethod || processing}
                  className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Complete Purchase'}
                </BaseButton>
              )}
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="space-y-6">
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-[#ffd700]" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.selectedPackage ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Package</span>
                      <span className="text-white">{formData.selectedPackage.packageDefinition.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Quantity</span>
                      <span className="text-white">{formData.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Price per unit</span>
                      <span className="text-white">
                        {formData.selectedPackage.currency.symbol}{formData.selectedPackage.price}
                      </span>
                    </div>
                    <div className="border-t border-[#16213e] pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-[#ffd700] font-bold text-lg">
                          {formData.selectedPackage.currency.symbol}
                          {(typeof formData.selectedPackage.price === 'number' && !isNaN(formData.selectedPackage.price) ? (formData.selectedPackage.price * formData.quantity).toFixed(2) : '0.00')}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-center py-4">Select a package to see order details</p>
                )}
              </CardContent>
            </Card>

            {/* User Information Summary */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <User className="w-5 h-5 text-[#ffd700]" />
                  <span>Your Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Name</span>
                  <span className="text-white text-sm">{formData.clientName || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Email</span>
                  <span className="text-white text-sm">{formData.clientEmail || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Phone</span>
                  <span className="text-white text-sm">{formData.clientPhone || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Language</span>
                  <span className="text-white text-sm capitalize">{formData.language}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
