'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ClientProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  question: string | null;
  language: string;
  role: string;
  status: string;
  adminNotes: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  sessionType: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    question: '',
    language: 'en',
    notes: ''
  });

  const fetchProfile = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/client/me', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
          setFormData({
            fullName: data.data.fullName || '',
            phone: data.data.phone || '',
            birthDate: data.data.birthDate || '',
            birthTime: data.data.birthTime || '',
            birthPlace: data.data.birthPlace || '',
            question: data.data.question || '',
            language: data.data.language || 'en',
            notes: data.data.notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!profile || !user?.access_token) return;

    setSaving(true);

    try {
      const response = await fetch('/api/client/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          birthPlace: formData.birthPlace,
          question: formData.question,
          language: formData.language,
          notes: formData.notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Profile updated successfully');
          setIsEditing(false);
          fetchProfile(); // Refresh profile data
        } else {
          throw new Error(data.error || 'Failed to update profile');
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate || '',
        birthTime: profile.birthTime || '',
        birthPlace: profile.birthPlace || '',
        question: profile.question || '',
        language: profile.language || 'en',
        notes: profile.notes || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-400">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-2">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleCancel} variant="outline" className="border-[#0a0a23] text-white hover:bg-[#0a0a23]">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-[#16213e] border-[#0a0a23] text-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-gray-300">Date of Birth</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>

            <div>
              <Label htmlFor="birthTime" className="text-gray-300">Time of Birth</Label>
              <Input
                id="birthTime"
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Help us provide better service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="birthPlace" className="text-gray-300">Place of Birth</Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
                placeholder="City, Country"
              />
            </div>

            <div>
              <Label htmlFor="language" className="text-gray-300">Preferred Language</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => setFormData({ ...formData, language: value })}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question" className="text-gray-300">Spiritual Question/Preferences</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
                rows={3}
                placeholder="Your spiritual questions or preferences..."
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={!isEditing}
                className="bg-[#16213e] border-[#0a0a23] text-white"
                rows={2}
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
