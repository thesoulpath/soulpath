'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BaseButton } from '@/components/ui/BaseButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Users, CheckCircle, CreditCard, ShoppingCart, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { StripeInlineForm } from '@/components/stripe/StripeInlineForm';

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

export function PackagePurchaseFlow() {
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

  const steps = [
    { id: 0, name: 'Select Package', description: 'Choose your package' },
    { id: 1, name: 'Review Details', description: 'Confirm your information' },
    { id: 2, name: 'Payment', description: 'Complete your purchase' }
  ];

  const loadUserProfile = useCallback(async () => {
    if (!user?.access_token) return;

    try {
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
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [user?.access_token]);

  const loadPackages = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      const response = await fetch('/api/client/packages', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPackages(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  }, [user?.access_token]);

  const loadPaymentMethods = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      const response = await fetch('/api/client/payment-methods', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentMethods(data.data);
          // Auto-select Stripe as default payment method
          const stripeMethod = data.data.find((method: PaymentMethod) => method.type === 'stripe');
          if (stripeMethod) {
            setFormData(prev => ({ ...prev, selectedPaymentMethod: stripeMethod }));
          }
        }
      } else {
        // If payment methods fail to load, create a default Stripe method
        console.warn('Failed to load payment methods, using default Stripe');
        const defaultStripeMethod = {
          id: 1,
          name: 'Credit Card',
          type: 'stripe',
          description: 'Pay with Visa, Mastercard, or American Express',
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg',
          requiresConfirmation: false,
          autoAssignPackage: true,
          isActive: true
        };
        setPaymentMethods([defaultStripeMethod]);
        setFormData(prev => ({ ...prev, selectedPaymentMethod: defaultStripeMethod }));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  }, [user?.access_token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadPackages(),
        loadPaymentMethods()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile, loadPackages, loadPaymentMethods]);

  useEffect(() => {
    if (user?.access_token) {
      loadData();
    }
  }, [user?.access_token, loadData]);

  const handlePackageSelect = (pkg: PackagePrice) => {
    setFormData(prev => ({ ...prev, selectedPackage: pkg }));
    setCurrentStep(1);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setFormData(prev => ({ ...prev, selectedPaymentMethod: method }));
    setShowPaymentMethodDropdown(false);
  };

  const handleInputChange = (field: keyof PurchaseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value) || 1;
    setFormData(prev => ({ ...prev, quantity: Math.max(1, Math.min(10, quantity)) }));
  };

  const handlePurchase = async () => {
    if (!formData.selectedPackage || !formData.selectedPaymentMethod) {
      toast.error('Please select a package and payment method');
      return;
    }

    setProcessing(true);

    try {
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
        // Reset form
        setFormData(prev => ({
          ...prev,
          selectedPackage: null,
          selectedPaymentMethod: null,
          quantity: 1,
          notes: ''
        }));
        setCurrentStep(0);
      } else {
        toast.error(result.message || 'Failed to complete purchase');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Select Your Package</h2>
              <p className="text-gray-400">Choose the perfect package for your spiritual journey</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`cursor-pointer transition-all ${
                    formData.selectedPackage?.id === pkg.id 
                      ? 'ring-2 ring-[#ffd700] bg-[#1a1a2e]' 
                      : 'bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50'
                  }`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-[#ffd700]" />
                        <CardTitle className="text-lg text-white">{pkg.packageDefinition.name}</CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#ffd700]">
                          {pkg.currency.symbol}{pkg.price}
                        </div>
                        <div className="text-sm text-gray-400">{pkg.currency.code}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-300 text-sm">{pkg.packageDefinition.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{pkg.packageDefinition.sessionsCount} sessions</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-white">What&apos;s included:</h4>
                      <ul className="space-y-1">
                        <li className="flex items-center space-x-2 text-sm text-gray-300">
                          <CheckCircle className="w-3 h-3 text-[#ffd700]" />
                          <span>Personalized spiritual guidance</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-gray-300">
                          <CheckCircle className="w-3 h-3 text-[#ffd700]" />
                          <span>Flexible scheduling</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm text-gray-300">
                          <CheckCircle className="w-3 h-3 text-[#ffd700]" />
                          <span>Email support</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Review Your Information</h2>
              <p className="text-gray-400">Please review and update your details if needed</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <User className="w-5 h-5 text-[#ffd700]" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clientName" className="text-gray-300">Full Name</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
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
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="clientPhone" className="text-gray-300">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Birth Information */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-[#ffd700]" />
                    <span>Birth Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  
                  <div>
                    <Label htmlFor="birthPlace" className="text-gray-300">Birth Place</Label>
                    <Input
                      id="birthPlace"
                      value={formData.birthPlace}
                      onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="question" className="text-gray-300">Your Question</Label>
                    <Textarea
                      id="question"
                      value={formData.question}
                      onChange={(e) => handleInputChange('question', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
                      rows={3}
                      placeholder="What would you like guidance on?"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Package Summary */}
            {formData.selectedPackage && (
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white">Package Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{formData.selectedPackage.packageDefinition.name}</h3>
                      <p className="text-gray-400">{formData.selectedPackage.packageDefinition.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#ffd700]">
                        {formData.selectedPackage.currency.symbol}{formData.selectedPackage.price}
                      </div>
                      <div className="text-sm text-gray-400">per package</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="quantity" className="text-gray-300">Quantity:</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className="w-20 bg-[#16213e] border-[#0a0a23] text-white text-center"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        Total: {formData.selectedPackage.currency.symbol}{(formData.selectedPackage.price * formData.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Complete Your Purchase</h2>
              <p className="text-gray-400">Choose your payment method and complete the transaction</p>
            </div>

            {/* Payment Method Selection */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentMethodDropdown(!showPaymentMethodDropdown)}
                      className="bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {formData.selectedPaymentMethod ? formData.selectedPaymentMethod.name : 'Select Payment Method'}
                    </Button>
                  </div>

                  {showPaymentMethodDropdown && (
                    <div className="space-y-2">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          onClick={() => handlePaymentMethodSelect(method)}
                          className="p-3 border border-[#0a0a23] rounded-lg cursor-pointer hover:bg-[#0a0a23] transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img src={method.icon} alt={method.name} className="w-6 h-6" />
                            <div>
                              <div className="text-white font-medium">{method.name}</div>
                              <div className="text-gray-400 text-sm">{method.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stripe Payment Form */}
                  {formData.selectedPaymentMethod?.type === 'stripe' && (
                    <div className="mt-4">
                      <StripeInlineForm
                        amount={formData.selectedPackage ? formData.selectedPackage.price * formData.quantity * 100 : 0}
                        currency={formData.selectedPackage?.currency.code || 'usd'}
                        description={`Purchase of ${formData.selectedPackage?.packageDefinition.name || 'package'} (${formData.quantity} ${formData.quantity === 1 ? 'unit' : 'units'})`}
                        customerEmail={formData.clientEmail}
                        onSuccess={() => {
                          toast.success('Payment successful!');
                          handlePurchase();
                        }}
                        onError={(error) => {
                          toast.error(`Payment failed: ${error}`);
                        }}
                      />
                    </div>
                  )}

                  {/* Other Payment Methods */}
                  {formData.selectedPaymentMethod?.type !== 'stripe' && formData.selectedPaymentMethod && (
                    <div className="mt-4 p-4 bg-[#16213e] rounded-lg">
                      <p className="text-gray-300 text-sm">
                        You selected {formData.selectedPaymentMethod.name}. 
                        {formData.selectedPaymentMethod.requiresConfirmation 
                          ? ' Please contact us to complete your payment.' 
                          : ' Click the button below to complete your purchase.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Summary */}
            {formData.selectedPackage && (
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Package:</span>
                    <span className="text-white font-medium">{formData.selectedPackage.packageDefinition.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Quantity:</span>
                    <span className="text-white font-medium">{formData.quantity}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Price per package:</span>
                    <span className="text-white font-medium">
                      {formData.selectedPackage.currency.symbol}{formData.selectedPackage.price}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-lg font-bold border-t border-[#0a0a23] pt-4">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-[#ffd700]">
                      {formData.selectedPackage.currency.symbol}{(formData.selectedPackage.price * formData.quantity).toFixed(2)}
                    </span>
                  </div>

                  {formData.selectedPaymentMethod?.type !== 'stripe' && (
                    <Button
                      onClick={handlePurchase}
                      disabled={!formData.selectedPaymentMethod || processing}
                      className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                    >
                      {processing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="w-4 h-4" />
                          <span>Complete Purchase</span>
                        </div>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading purchase options...</p>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-400/50 mb-4" />
        <h3 className="text-lg font-heading text-white mb-2">No Packages Available</h3>
        <p className="text-gray-400 mb-4">There are currently no packages available for purchase. Please check back later.</p>
        <BaseButton 
          className="dashboard-button-primary"
          onClick={() => window.location.reload()}
        >
          <Package size={16} className="mr-2" />
          Refresh
        </BaseButton>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id 
                  ? 'bg-[#ffd700] text-black' 
                  : 'bg-[#16213e] text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.id + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-gray-400'
                }`}>
                  {step.name}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-[#ffd700]' : 'bg-[#16213e]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          variant="outline"
          className="bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23] disabled:opacity-50"
        >
          Previous
        </Button>
        
        {currentStep < 2 && (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!formData.selectedPackage || (currentStep === 1 && !formData.clientName)}
            className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}