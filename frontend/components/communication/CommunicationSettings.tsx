'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Mail, Smartphone, Settings } from 'lucide-react';
import { CommunicationConfig } from './CommunicationConfig';
import { TemplateLibrary } from './TemplateLibrary';

export function CommunicationSettings() {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Communication Settings</h1>
          <p className="dashboard-text-secondary mt-2">Configure email and SMS communication services and templates</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="dashboard-tabs">
          <TabsTrigger value="config" className="dashboard-tab">
            <Settings size={16} className="mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="email" className="dashboard-tab">
            <Mail size={16} className="mr-2" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="sms" className="dashboard-tab">
            <Smartphone size={16} className="mr-2" />
            SMS Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <CommunicationConfig />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <TemplateLibrary type="email" />
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <TemplateLibrary type="sms" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
