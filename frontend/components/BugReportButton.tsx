'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Bug, X, Camera, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';

import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import html2canvas from 'html2canvas';

interface BugReportData {
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function BugReportButton() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      // Use html2canvas for actual screenshot capture
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#1a1a2e'
      });
      
      // Convert to base64
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshot(dataUrl);
      toast.success('Screenshot captured successfully!');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit a bug report');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          screenshot,
        }),
      });

      if (response.ok) {
        toast.success('Bug report submitted successfully!');
        setIsModalOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM'
    });
    setScreenshot(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Floating Bug Report Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
          title="Report a Bug"
        >
          <Bug size={24} />
        </button>
      </motion.div>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <BaseModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            size="lg"
            title="Report a Bug"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Screenshot Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Screenshot (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <BaseButton
                    type="button"
                    onClick={captureScreenshot}
                    disabled={isCapturing}
                    variant="outline"
                    size="sm"
                    leftIcon={<Camera size={16} />}
                  >
                    {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
                  </BaseButton>
                  {screenshot && (
                    <BaseButton
                      type="button"
                      onClick={() => setScreenshot(null)}
                      variant="outline"
                      size="sm"
                      leftIcon={<X size={16} />}
                    >
                      Remove
                    </BaseButton>
                  )}
                </div>
                {screenshot && (
                  <div className="mt-3">
                    <Image
                      src={screenshot}
                      alt="Screenshot"
                      width={300}
                      height={128}
                      className="max-w-full h-32 object-cover rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-300">
                  Bug Title *
                </label>
                <BaseInput
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-gray-300">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="UI/UX">UI/UX Issue</option>
                  <option value="Functionality">Functionality Problem</option>
                  <option value="Performance">Performance Issue</option>
                  <option value="Payment">Payment Problem</option>
                  <option value="Booking">Booking System</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-gray-300">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-300">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe the issue in detail, including steps to reproduce..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <BaseButton
                  type="button"
                  onClick={handleModalClose}
                  variant="outline"
                  size="md"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  size="md"
                  leftIcon={<Send size={16} />}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </BaseButton>
              </div>
            </form>
          </BaseModal>
        )}
      </AnimatePresence>
    </>
  );
}
