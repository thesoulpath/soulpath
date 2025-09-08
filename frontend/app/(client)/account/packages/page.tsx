'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageIcon, CalendarIcon, ShoppingCart } from 'lucide-react';


import { PackagePurchaseFlow } from '@/components/PackagePurchaseFlow';

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
  packagePrices?: Array<{
    price: number;
    currency: {
      symbol: string;
      code: string;
    };
  }>;
  sessionDuration?: {
    duration_minutes: number;
  };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/packages');
      const result = await response.json();
      
      if (result.success) {
        setPackages(result.data);
      } else {
        console.error('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading available packages...</p>
        </div>
      </div>
    );
  }

  if (showPurchaseFlow) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowPurchaseFlow(false)}
            className="mb-4 border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
          >
            ← Back to Packages
          </Button>
        </div>
        <PackagePurchaseFlow />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Available Packages</h1>
        <p className="text-gray-400 mt-2">Choose the perfect package for your spiritual journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="bg-[#1a1a2e] border-[#16213e] text-white hover:border-[#ffd700]/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <PackageIcon className="w-5 h-5 text-[#ffd700]" />
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#ffd700]">
                    {pkg.packagePrices && pkg.packagePrices.length > 0
                      ? `${pkg.packagePrices[0].currency.symbol}${(typeof pkg.packagePrices[0].price === 'number' && !isNaN(pkg.packagePrices[0].price) ? pkg.packagePrices[0].price.toFixed(2) : '0.00')}`
                      : 'Price TBD'
                    }
                  </div>
                  <div className="text-sm text-gray-400">
                    {pkg.packagePrices && pkg.packagePrices.length > 0 
                      ? pkg.packagePrices[0].currency.code 
                      : 'USD'
                    }
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">{pkg.description}</p>
              
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{pkg.sessionDuration?.duration_minutes || 'N/A'} minutes</span>
              </div>

              {pkg.features && pkg.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Features:</h4>
                  <ul className="space-y-1">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-300">• {feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90"
                  onClick={() => setShowPurchaseFlow(true)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase Package
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-12">
        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardHeader>
            <CardTitle className="text-white">About Our Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#ffd700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PackageIcon className="w-6 h-6 text-[#ffd700]" />
                </div>
                <h3 className="text-white font-semibold mb-2">Flexible Sessions</h3>
                <p className="text-gray-400 text-sm">
                  Choose from various session lengths and types to suit your needs
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-[#ffd700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-6 h-6 text-[#ffd700]" />
                </div>
                <h3 className="text-white font-semibold mb-2">Easy Booking</h3>
                <p className="text-gray-400 text-sm">
                  Book sessions at your convenience with our flexible scheduling system
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-[#ffd700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-6 h-6 text-[#ffd700]" />
                </div>
                <h3 className="text-white font-semibold mb-2">Secure Payment</h3>
                <p className="text-gray-400 text-sm">
                  Safe and secure payment processing with multiple payment options
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
