'use client';

import React from 'react';
import { CalendlyBookingFlow } from './CalendlyBookingFlow';

interface BookingSectionProps {
  t: Record<string, string | Record<string, string>>;
  language: string;
}

export function BookingSection({ t, language }: BookingSectionProps) {
  // Go straight to the Calendly flow (package selection)
  return <CalendlyBookingFlow t={t} language={language} />;
}