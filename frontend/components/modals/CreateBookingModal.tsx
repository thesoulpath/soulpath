'use client';

import React, { useState, useEffect } from 'react';

import { 
  Calendar, 
  Package, 
  Clock, 
  X, 
  Save,
  DollarSign
} from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Client {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
}

interface UserPackage {
  id: number;
  sessions_remaining: number;
  sessions_used: number;
  is_active: boolean;
  package_definition: {
    id: number;
    name: string;
    description: string;
    sessions_count: number;
    package_type: 'individual' | 'group' | 'mixed';
    max_group_size: number;
    session_durations: {
      id: number;
      name: string;
      duration_minutes: number;
    };
  };
  package_price: {
    id: number;
    price: number;
    pricing_mode: 'custom' | 'calculated';
    currencies: {
      id: number;
      code: string;
      name: string;
      symbol: string;
    };
  };
}

interface ScheduleSlot {
  id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  schedule_templates: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    session_durations: {
      id: number;
      name: string;
      duration_minutes: number;
    };
  };
}

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSuccess: () => void;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess
}) => {

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    user_package_id: '',
    schedule_slot_id: '',
    booking_type: 'individual' as 'individual' | 'group',
    group_size: 1,
    notes: '',
    total_amount: '',
    discount_amount: '0'
  });

  // Mock data - replace with actual API calls
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<UserPackage | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load user packages and schedule slots
      loadUserPackages();
      loadScheduleSlots();
    }
  }, [isOpen]);

  const loadUserPackages = async () => {
    // Mock data - replace with actual API call
    const mockPackages: UserPackage[] = [
      {
        id: 1,
        sessions_remaining: 5,
        sessions_used: 2,
        is_active: true,
        package_definition: {
          id: 1,
          name: 'Individual Therapy Package',
          description: '10 sessions of individual therapy',
          sessions_count: 10,
          package_type: 'individual',
          max_group_size: 1,
          session_durations: {
            id: 1,
            name: 'Standard Session',
            duration_minutes: 60
          }
        },
        package_price: {
          id: 1,
          price: 1200,
          pricing_mode: 'custom',
          currencies: {
            id: 1,
            code: 'USD',
            name: 'US Dollar',
            symbol: '$'
          }
        }
      }
    ];
    setUserPackages(mockPackages);
  };

  const loadScheduleSlots = async () => {
    // Mock data - replace with actual API call
    const mockSlots: ScheduleSlot[] = [
      {
        id: 1,
        start_time: '09:00',
        end_time: '10:00',
        capacity: 1,
        booked_count: 0,
        is_available: true,
        schedule_templates: {
          id: 1,
          day_of_week: 'Monday',
          start_time: '09:00',
          end_time: '10:00',
          session_durations: {
            id: 1,
            name: 'Standard Session',
            duration_minutes: 60
          }
        }
      }
    ];
    setScheduleSlots(mockSlots);
  };

  const handlePackageSelect = (packageId: string) => {
    setFormData(prev => ({ ...prev, user_package_id: packageId }));
    const pkg = userPackages.find(p => p.id.toString() === packageId);
    setSelectedPackage(pkg || null);
  };

  const handleSlotSelect = (slotId: string) => {
    setFormData(prev => ({ ...prev, schedule_slot_id: slotId }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.user_package_id) {
      toast.error('Please select a package');
      return;
    }
    if (step === 2 && !formData.schedule_slot_id) {
      toast.error('Please select a time slot');
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.user_package_id || !formData.schedule_slot_id) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Booking created successfully!');
      onSuccess();
      handleClose();
    } catch (_error) {
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      user_package_id: '',
      schedule_slot_id: '',
      booking_type: 'individual',
      group_size: 1,
      notes: '',
      total_amount: '',
      discount_amount: '0'
    });
    setSelectedPackage(null);
    onClose();
  };

  const getPackageTypeBadge = (type: string) => {
    const variants = {
      individual: `bg-[#E0F2FE] text-[#007BFF]`,
      group: `bg-[#FFF3CD] text-[#FFC107]`,
      mixed: `bg-[#FFF3CD] text-[#FFC107]`
    };
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Booking"
              description={`Create a new booking for ${client.fullName} (${client.email})`}
      size="full"
      variant="default"
    >
      <BaseModal.Header icon={<Calendar className="w-5 h-5" />}>
        <div className="flex items-center gap-2">
          <Calendar className={`w-5 h-5 text-[#007BFF]`} />
          <h3 className={`text-[1.125rem] font-[500] text-[#1F2937]`}>
            Create New Booking
          </h3>
        </div>
      </BaseModal.Header>

      <BaseModal.Content>
        <div className="space-y-[1rem]">
          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div className="space-y-[0.5rem]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#E0F2FE] text-[#007BFF] rounded-full flex items-center justify-center text-[0.75rem] font-[500]">
                  1
                </div>
                <h3 className={`text-[1.125rem] font-[600] text-[#1F2937]`}>
                  Select Package
                </h3>
              </div>

              {userPackages.length === 0 ? (
                <div className="text-center py-8">
                  <Package className={`w-12 h-12 text-[#9CA3AF] mx-auto mb-[0.5rem]`} />
                  <p className={`text-[#6B7280]`}>No active packages found for this client</p>
                  <p className={`text-[0.75rem] text-[#9CA3AF] mt-[0.25rem]`}>
                    The client needs to purchase a package first
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {userPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-[0.5rem] border rounded-[0.5rem] cursor-pointer transition-all hover:border-[#90CDF4] hover:bg-[#EBF8FF] ${
                        formData.user_package_id === pkg.id.toString() 
                          ? `border-[#63B3ED] bg-[#EBF8FF]` 
                          : `border-[#E2E8F0]`
                      }`}
                      onClick={() => handlePackageSelect(pkg.id.toString())}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-[600] text-[#1F2937]`}>
                              {pkg.package_definition.name}
                            </h4>
                            {getPackageTypeBadge(pkg.package_definition.package_type)}
                          </div>
                          <p className={`text-[0.75rem] text-[#6B7280] mb-[0.25rem]`}>
                            {pkg.package_definition.description}
                          </p>
                          <div className="flex items-center gap-[0.5rem] text-[0.75rem] text-[#9CA3AF]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {pkg.package_definition.session_durations.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {pkg.sessions_remaining} of {pkg.package_definition.sessions_count} remaining
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {pkg.package_price.currencies.symbol}{pkg.package_price.price}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={pkg.is_active ? `bg-[#4CAF50] text-white` : `bg-[#F44336] text-white`}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Time Slot Selection */}
          {step === 2 && (
            <div className="space-y-[0.5rem]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#E0F2FE] text-[#007BFF] rounded-full flex items-center justify-center text-[0.75rem] font-[500]">
                  2
                </div>
                <h3 className={`text-[1.125rem] font-[600] text-[#1F2937]`}>
                  Select Time Slot
                </h3>
              </div>

              {selectedPackage && (
                <div className="mb-[0.5rem] p-[0.375rem] bg-[#EBF8FF] border border-[#90CDF4] rounded-[0.5rem]">
                  <p className={`text-[0.75rem] text-[#4299E1]`}>
                    <strong>Selected Package:</strong> {selectedPackage.package_definition.name} 
                    ({selectedPackage.package_definition.session_durations.duration_minutes} min)
                  </p>
                </div>
              )}

              {scheduleSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className={`w-12 h-12 text-[#9CA3AF] mx-auto mb-[0.5rem]`} />
                  <p className={`text-[#6B7280]`}>No available time slots found</p>
                  <p className={`text-[0.75rem] text-[#9CA3AF] mt-[0.25rem]`}>
                    Please try a different date or contact support
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {scheduleSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-[0.5rem] border rounded-[0.5rem] cursor-pointer transition-all hover:border-[#90CDF4] hover:bg-[#EBF8FF] ${
                        formData.schedule_slot_id === slot.id.toString() 
                          ? `border-[#63B3ED] bg-[#EBF8FF]` 
                          : `border-[#E2E8F0]`
                      }`}
                      onClick={() => handleSlotSelect(slot.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold">
                            {slot.start_time} - {slot.end_time}
                          </div>
                          <div className={`text-[0.75rem] text-[#6B7280]`}>
                            {slot.schedule_templates.day_of_week}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`bg-[#4CAF50] text-white`}>
                            Available
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Booking Details */}
          {step === 3 && (
            <div className="space-y-[0.5rem]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#E0F2FE] text-[#007BFF] rounded-full flex items-center justify-center text-[0.75rem] font-[500]">
                  3
                </div>
                <h3 className={`text-[1.125rem] font-[600] text-[#1F2937]`}>
                  Booking Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-[0.5rem]">
                <div className="space-y-[0.25rem]">
                  <Label className={`text-[0.75rem] font-[500] text-[#6B7280]`}>
                    Booking Type
                  </Label>
                  <Select
                    value={formData.booking_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, booking_type: value as 'individual' | 'group' }))}
                  >
                    <SelectTrigger className={`bg-[#F9FAFB] border-[#D1D5DB] text-[#1F2937]`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`bg-[#F9FAFB] border-[#D1D5DB]`}>
                      <SelectItem value="individual" className={`text-[#1F2937] hover:bg-[#F4F6F8]`}>
                        Individual
                      </SelectItem>
                      <SelectItem value="group" className={`text-[#1F2937] hover:bg-[#F4F6F8]`}>
                        Group
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.booking_type === 'group' && (
                  <div className="space-y-[0.25rem]">
                    <Label className={`text-[0.75rem] font-[500] text-[#6B7280]`}>
                      Group Size
                    </Label>
                    <BaseInput
                      type="number"
                      min="2"
                      max="10"
                      value={formData.group_size.toString()}
                      onChange={(e) => setFormData(prev => ({ ...prev, group_size: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-[0.25rem]">
                <Label className={`text-[0.75rem] font-[500] text-[#6B7280]`}>
                  Notes (Optional)
                </Label>
                <Textarea
                  placeholder="Add any special requirements or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className={`bg-[#F9FAFB] border-[#D1D5DB] text-[#1F2937] placeholder:text-[#9CA3AF]`}
                  rows={3}
                />
              </div>

              {selectedPackage && (
                <div className="p-[0.5rem] bg-[#F9FAFB] rounded-[0.5rem] border border-[#D1D5DB]">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Booking Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{selectedPackage.package_definition.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{selectedPackage.package_definition.session_durations.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>{selectedPackage.package_price.currencies.symbol}{selectedPackage.package_price.price}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </BaseModal.Content>

      <BaseModal.Footer>
        <div className="flex items-center justify-between w-full">
          <BaseButton
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            leftIcon={<X className="w-4 h-4" />}
          >
            Back
          </BaseButton>

          <div className="flex gap-2">
            <BaseButton
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </BaseButton>
            
            {step < 3 ? (
              <BaseButton
                variant="primary"
                onClick={handleNext}
                rightIcon={<Save className="w-4 h-4" />}
              >
                Next
              </BaseButton>
            ) : (
              <BaseButton
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Create Booking
              </BaseButton>
            )}
          </div>
        </div>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default CreateBookingModal;
