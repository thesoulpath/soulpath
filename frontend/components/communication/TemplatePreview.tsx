'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BaseButton } from '../ui/BaseButton';
import { BaseInput } from '../ui/BaseInput';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  X, 
  Mail,
  Smartphone,
  Copy,
  CheckCircle
} from 'lucide-react';
import { replacePlaceholders } from '../../lib/communication/placeholders';

interface Template {
  id: number;
  templateKey: string;
  name: string;
  description?: string;
  type: 'email' | 'sms';
  category?: string;
  isActive: boolean;
  isDefault: boolean;
  translations: TemplateTranslation[];
}

interface TemplateTranslation {
  id: number;
  language: string;
  subject?: string;
  content: string;
}

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
}

const SAMPLE_DATA = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  bookingId: 'BK-12345',
  language: 'English',
  adminEmail: 'admin@soulpath.lat',
  submissionDate: '2024-01-15',
  birthDate: '1990-05-15',
  birthTime: '14:30',
  birthPlace: 'New York, USA',
  clientQuestion: 'What does my future hold?',
  bookingDate: '2024-01-20',
  bookingTime: '10:00 AM',
  reminderDate: '2024-01-19',
  newDate: '2024-01-25',
  newTime: '2:00 PM',
  oldDate: '2024-01-20',
  oldTime: '10:00 AM',
  rescheduleReason: 'Emergency',
  rescheduleDate: '2024-01-18',
  otpCode: '123456',
  expiryTime: '10 minutes',
  sessionType: 'Individual Reading',
  videoConferenceLink: 'https://meet.google.com/abc-defg-hij'
};

export function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [customData, setCustomData] = useState(SAMPLE_DATA);
  const [copied, setCopied] = useState<string | null>(null);

  const currentTranslation = template.translations.find(t => t.language === activeLanguage);

  const getPreviewContent = () => {
    if (!currentTranslation) return '';
    return replacePlaceholders(currentTranslation.content, customData);
  };

  const getPreviewSubject = () => {
    if (!currentTranslation?.subject) return '';
    return replacePlaceholders(currentTranslation.subject, customData);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const languages = template.translations.map(t => t.language);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A23] rounded-lg border border-[#C0C0C0]/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#C0C0C0]/20">
          <div className="flex items-center gap-3">
            {template.type === 'email' ? <Mail size={20} className="text-[#EAEAEA]" /> : <Smartphone size={20} className="text-[#EAEAEA]" />}
            <div>
              <CardTitle className="text-[#EAEAEA] text-xl">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {template.type.toUpperCase()}
                </Badge>
                {template.category && (
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                )}
                {template.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </div>
            </div>
          </div>
          <BaseButton
            variant="outline"
            onClick={onClose}
            className="text-[#EAEAEA] border-[#C0C0C0]/30"
          >
            <X size={16} />
          </BaseButton>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0A0A23]/50 border-[#C0C0C0]/30">
              {languages.map(lang => (
                <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
                  {lang.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeLanguage} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-[#EAEAEA]">Preview</h3>
                    <div className="flex gap-2">
                      {template.type === 'email' && getPreviewSubject() && (
                        <BaseButton
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(getPreviewSubject(), 'subject')}
                          className="text-[#EAEAEA] border-[#C0C0C0]/30"
                        >
                          {copied === 'subject' ? <CheckCircle size={14} /> : <Copy size={14} />}
                          Copy Subject
                        </BaseButton>
                      )}
                      <BaseButton
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getPreviewContent(), 'content')}
                        className="text-[#EAEAEA] border-[#C0C0C0]/30"
                      >
                        {copied === 'content' ? <CheckCircle size={14} /> : <Copy size={14} />}
                        Copy Content
                      </BaseButton>
                    </div>
                  </div>

                  <Card className="bg-[#0A0A23]/50 border-[#C0C0C0]/20">
                    <CardContent className="p-6">
                      {template.type === 'email' ? (
                        <div className="space-y-4">
                          {getPreviewSubject() && (
                            <div>
                              <Label className="text-[#C0C0C0] text-sm">Subject:</Label>
                              <p className="text-[#EAEAEA] font-medium">{getPreviewSubject()}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-[#C0C0C0] text-sm">Content:</Label>
                            <div 
                              className="mt-2 p-4 bg-white/5 rounded border border-[#C0C0C0]/10"
                              dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-[#C0C0C0] text-sm">SMS Content:</Label>
                          <div className="mt-2 p-4 bg-white/5 rounded border border-[#C0C0C0]/10">
                            <p className="text-[#EAEAEA] whitespace-pre-wrap">{getPreviewContent()}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sample Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#EAEAEA]">Sample Data</h3>
                  <Card className="bg-[#0A0A23]/50 border-[#C0C0C0]/20">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {Object.entries(customData).map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-[#C0C0C0] text-sm">{key}:</Label>
                            <BaseInput
                              value={String(value)}
                              onChange={(e) => setCustomData(prev => ({ ...prev, [key]: e.target.value }))}
                              className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Template Info */}
              <Card className="bg-[#0A0A23]/50 border-[#C0C0C0]/20">
                <CardHeader>
                  <CardTitle className="text-[#EAEAEA] text-lg">Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#C0C0C0] text-sm">Template Key:</Label>
                      <p className="text-[#EAEAEA] font-mono text-sm">{template.templateKey}</p>
                    </div>
                    <div>
                      <Label className="text-[#C0C0C0] text-sm">Type:</Label>
                      <p className="text-[#EAEAEA] text-sm capitalize">{template.type}</p>
                    </div>
                    {template.category && (
                      <div>
                        <Label className="text-[#C0C0C0] text-sm">Category:</Label>
                        <p className="text-[#EAEAEA] text-sm capitalize">{template.category}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-[#C0C0C0] text-sm">Status:</Label>
                      <p className="text-[#EAEAEA] text-sm">
                        {template.isActive ? 'Active' : 'Inactive'}
                        {template.isDefault && ' (Default)'}
                      </p>
                    </div>
                  </div>
                  
                  {template.description && (
                    <div>
                      <Label className="text-[#C0C0C0] text-sm">Description:</Label>
                      <p className="text-[#EAEAEA] text-sm">{template.description}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-[#C0C0C0] text-sm">Available Languages:</Label>
                    <div className="flex gap-2 mt-1">
                      {template.translations.map(translation => (
                        <Badge key={translation.language} variant="outline" className="text-xs">
                          {translation.language.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
