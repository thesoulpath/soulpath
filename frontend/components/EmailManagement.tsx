import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BaseButton } from './ui/BaseButton';
import { BaseInput } from './ui/BaseInput';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Mail, Send, TestTube, Save, Eye, Settings, Video, Info, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';



interface EmailTemplate {
  en: {
    subject: string;
    html: string;
    videoConferenceLink?: {
      isActive: boolean;
      url: string;
      includeInTemplate?: boolean;
    };
  };
  es: {
    subject: string;
    html: string;
    videoConferenceLink?: {
      isActive: boolean;
      url: string;
      includeInTemplate?: boolean;
    };
  };
}

interface EmailConfig {
  brevoApiKey: string;
  senderEmail: string;
  senderName: string;
  adminEmail: string;
  defaultVideoLinks?: {
    en?: string;
    es?: string;
  };
}

// Enhanced placeholder list with video link support
interface Placeholder {
  key: string;
  description: string;
  isConditional?: boolean;
  isNew?: boolean;
}

const AVAILABLE_PLACEHOLDERS: Record<string, Placeholder[]> = {
  basic: [
    { key: '{{userName}}', description: 'User\'s full name' },
    { key: '{{userEmail}}', description: 'User\'s email address' },
    { key: '{{bookingId}}', description: 'Unique booking ID' },
    { key: '{{language}}', description: 'Session language (English/Spanish)' },
    { key: '{{adminEmail}}', description: 'Admin contact email' },
    { key: '{{submissionDate}}', description: 'When the booking was submitted' }
  ],
  booking: [
    { key: '{{birthDate}}', description: 'Client\'s birth date' },
    { key: '{{birthTime}}', description: 'Client\'s birth time' },
    { key: '{{birthPlace}}', description: 'Client\'s birth location' },
    { key: '{{clientQuestion}}', description: 'Client\'s specific question' },
    { key: '{{bookingDate}}', description: 'Scheduled session date' },
    { key: '{{bookingTime}}', description: 'Scheduled session time' },
    { key: '{{reminderDate}}', description: 'Date reminder was sent' }
  ],
  scheduling: [
    { key: '{{newDate}}', description: 'New rescheduled date' },
    { key: '{{newTime}}', description: 'New rescheduled time' },
    { key: '{{oldDate}}', description: 'Previous date' },
    { key: '{{oldTime}}', description: 'Previous time' },
    { key: '{{rescheduleReason}}', description: 'Reason for rescheduling' },
    { key: '{{rescheduleDate}}', description: 'Date of reschedule' }
  ],
  video: [
    { key: '{{videoConferenceLink}}', description: 'Video session link (when active)', isConditional: true },
    { key: '{{VIDEO_LINK}}', description: 'Direct video link placeholder', isNew: true },
    { key: '{{#if videoConferenceLink}}...{{/if}}', description: 'Conditional video link block', isConditional: true }
  ]
};

export function EmailManagement() {
  const { user } = useAuth();
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    brevoApiKey: '',
    senderEmail: '',
    senderName: '',
    adminEmail: '',
    defaultVideoLinks: {
      en: '',
      es: ''
    }
  });
  const [emailTemplates, setEmailTemplates] = useState<Record<string, EmailTemplate>>({});
  const [activeTemplate, setActiveTemplate] = useState('userBookingConfirmation');
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'es'>('en');
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPlaceholderHelper, setShowPlaceholderHelper] = useState(false);

  // Default templates with enhanced video link support
  const defaultTemplates: Record<string, EmailTemplate> = useMemo(() => ({
    userBookingConfirmation: {
      en: {
        subject: 'Booking Confirmation - SoulPath Astrology Reading',
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #191970, #0A0A23); color: #FFD700; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #191970; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .video-link { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .video-link a { color: #1976d2; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ SoulPath Astrology ✨</h1>
            <p>Your cosmic journey begins here</p>
        </div>
        <div class="content">
            <h2>Thank you for your booking, {{userName}}!</h2>
            <p>We're excited to guide you through your astrological reading. Your booking has been received and is being processed.</p>
            
            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <div class="detail-row"><span class="label">Booking ID:</span> {{bookingId}}</div>
                <div class="detail-row"><span class="label">Email:</span> {{userEmail}}</div>
                <div class="detail-row"><span class="label">Language:</span> {{language}}</div>
                <div class="detail-row"><span class="label">Birth Date:</span> {{birthDate}}</div>
                <div class="detail-row"><span class="label">Birth Time:</span> {{birthTime}}</div>
                <div class="detail-row"><span class="label">Birth Place:</span> {{birthPlace}}</div>
                <div class="detail-row"><span class="label">Your Question:</span> {{clientQuestion}}</div>
                <div class="detail-row"><span class="label">Submitted:</span> {{submissionDate}}</div>
            </div>

            {{#if videoConferenceLink}}
            <div class="video-link">
                <h3>🎥 Your Video Conference Link</h3>
                <p>Join your astrology reading session using the link below:</p>
                <a href="{{VIDEO_LINK}}" target="_blank">Join Video Session</a>
                <p><small>This link will be active 15 minutes before your scheduled session.</small></p>
            </div>
            {{/if}}

            <p><strong>What's Next?</strong></p>
            <ul>
                <li>José will review your birth chart information</li>
                <li>You'll receive a scheduling email within 24-48 hours</li>
                <li>Your personalized reading will be conducted via video call</li>
            </ul>

            <p>If you have any questions, please don't hesitate to contact us at {{adminEmail}}.</p>
        </div>
        <div class="footer">
            <p>© 2024 SoulPath Astrology - José Garfias<br>
            Guiding souls through the wisdom of the stars</p>
        </div>
    </div>
</body>
</html>`,
        videoConferenceLink: {
          isActive: false,
          url: '',
          includeInTemplate: true
        }
      },
      es: {
        subject: 'Confirmación de Cita - Lectura Astrológica SoulPath',
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Cita</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #191970, #0A0A23); color: #FFD700; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #191970; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .video-link { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .video-link a { color: #1976d2; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ SoulPath Astrología ✨</h1>
            <p>Tu viaje cósmico comienza aquí</p>
        </div>
        <div class="content">
            <h2>¡Gracias por tu reserva, {{userName}}!</h2>
            <p>Estamos emocionados de guiarte a través de tu lectura astrológica. Tu reserva ha sido recibida y está siendo procesada.</p>
            
            <div class="booking-details">
                <h3>📋 Detalles de la Reserva</h3>
                <div class="detail-row"><span class="label">ID de Reserva:</span> {{bookingId}}</div>
                <div class="detail-row"><span class="label">Email:</span> {{userEmail}}</div>
                <div class="detail-row"><span class="label">Idioma:</span> {{language}}</div>
                <div class="detail-row"><span class="label">Fecha de Nacimiento:</span> {{birthDate}}</div>
                <div class="detail-row"><span class="label">Hora de Nacimiento:</span> {{birthTime}}</div>
                <div class="detail-row"><span class="label">Lugar de Nacimiento:</span> {{birthPlace}}</div>
                <div class="detail-row"><span class="label">Tu Pregunta:</span> {{clientQuestion}}</div>
                <div class="detail-row"><span class="label">Enviado:</span> {{submissionDate}}</div>
            </div>

            {{#if videoConferenceLink}}
            <div class="video-link">
                <h3>🎥 Tu Enlace de Videoconferencia</h3>
                <p>Únete a tu sesión de lectura astrológica usando el enlace de abajo:</p>
                <a href="{{VIDEO_LINK}}" target="_blank">Unirse a la Sesión de Video</a>
                <p><small>Este enlace estará activo 15 minutos antes de tu sesión programada.</small></p>
            </div>
            {{/if}}

            <p><strong>¿Qué sigue?</strong></p>
            <ul>
                <li>José revisará la información de tu carta natal</li>
                <li>Recibirás un email de programación dentro de 24-48 horas</li>
                <li>Tu lectura personalizada se realizará por videollamada</li>
            </ul>

            <p>Si tienes alguna pregunta, no dudes en contactarnos en {{adminEmail}}.</p>
        </div>
        <div class="footer">
            <p>© 2024 SoulPath Astrología - José Garfias<br>
            Guiando almas a través de la sabiduría de las estrellas</p>
        </div>
    </div>
</body>
</html>`,
        videoConferenceLink: {
          isActive: false,
          url: '',
          includeInTemplate: true
        }
      }
    },
    bookingReminder: {
      en: {
        subject: 'Reminder: Your SoulPath Astrology Reading',
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reading Reminder</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #191970, #0A0A23); color: #FFD700; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #191970; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .video-link { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .video-link a { color: #1976d2; text-decoration: none; font-weight: bold; }
        .reminder-alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 Reading Reminder</h1>
            <p>Your cosmic guidance awaits</p>
        </div>
        <div class="content">
            <div class="reminder-alert">
                <h3>⏰ Upcoming Session</h3>
                <p>This is a friendly reminder about your upcoming astrology reading.</p>
            </div>

            <h2>Hello {{userName}},</h2>
            <p>We're looking forward to your astrology reading session!</p>
            
            <div class="booking-details">
                <h3>📅 Session Details</h3>
                <div class="detail-row"><span class="label">Date:</span> {{bookingDate}}</div>
                <div class="detail-row"><span class="label">Time:</span> {{bookingTime}}</div>
                <div class="detail-row"><span class="label">Language:</span> {{language}}</div>
                <div class="detail-row"><span class="label">Booking ID:</span> {{bookingId}}</div>
            </div>

            {{#if videoConferenceLink}}
            <div class="video-link">
                <h3>🎥 Join Your Session</h3>
                <p>Click the link below to join your reading:</p>
                <a href="{{VIDEO_LINK}}" target="_blank">Join Video Session</a>
                <p><small>Link will be active 15 minutes before your session.</small></p>
            </div>
            {{/if}}

            <p><strong>What to expect:</strong></p>
            <ul>
                <li>Detailed analysis of your birth chart</li>
                <li>Insights into your cosmic influences</li>
                <li>Guidance on your spiritual path</li>
                <li>Time for your questions and discussion</li>
            </ul>

            <p>If you need to reschedule or have any questions, please contact us at {{adminEmail}}.</p>
        </div>
        <div class="footer">
            <p>© 2024 SoulPath Astrology - José Garfias<br>
            Reminder sent on {{reminderDate}}</p>
        </div>
    </div>
</body>
</html>`,
        videoConferenceLink: {
          isActive: false,
          url: '',
          includeInTemplate: true
        }
      },
      es: {
        subject: 'Recordatorio: Tu Lectura Astrológica SoulPath',
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Lectura</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #191970, #0A0A23); color: #FFD700; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #191970; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .video-link { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .video-link a { color: #1976d2; text-decoration: none; font-weight: bold; }
        .reminder-alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 Recordatorio de Lectura</h1>
            <p>Tu guía cósmica te espera</p>
        </div>
        <div class="content">
            <div class="reminder-alert">
                <h3>⏰ Sesión Próxima</h3>
                <p>Este es un recordatorio amistoso sobre tu próxima lectura astrológica.</p>
            </div>

            <h2>Hola {{userName}},</h2>
            <p>¡Estamos esperando con ansias tu sesión de lectura astrológica!</p>
            
            <div class="booking-details">
                <h3>📅 Detalles de la Sesión</h3>
                <div class="detail-row"><span class="label">Fecha:</span> {{bookingDate}}</div>
                <div class="detail-row"><span class="label">Hora:</span> {{bookingTime}}</div>
                <div class="detail-row"><span class="label">Idioma:</span> {{language}}</div>
                <div class="detail-row"><span class="label">ID de Reserva:</span> {{bookingId}}</div>
            </div>

            {{#if videoConferenceLink}}
            <div class="video-link">
                <h3>🎥 Únete a tu Sesión</h3>
                <p>Haz clic en el enlace de abajo para unirte a tu lectura:</p>
                <a href="{{VIDEO_LINK}}" target="_blank">Unirse a la Sesión de Video</a>
                <p><small>El enlace estará activo 15 minutos antes de tu sesión.</small></p>
            </div>
            {{/if}}

            <p><strong>Qué esperar:</strong></p>
            <ul>
                <li>Análisis detallado de tu carta natal</li>
                <li>Perspectivas sobre tus influencias cósmicas</li>
                <li>Guía en tu camino espiritual</li>
                <li>Tiempo para tus preguntas y discusión</li>
            </ul>

            <p>Si necesitas reprogramar o tienes alguna pregunta, por favor contáctanos en {{adminEmail}}.</p>
        </div>
        <div class="footer">
            <p>© 2024 SoulPath Astrología - José Garfias<br>
            Recordatorio enviado el {{reminderDate}}</p>
        </div>
    </div>
</body>
</html>`,
        videoConferenceLink: {
          isActive: false,
          url: '',
          includeInTemplate: true
        }
      }
    },
    adminBookingNotification: {
      en: {
        subject: 'New Booking Received - SoulPath Astrology',
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Notification</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #191970, #0A0A23); color: #FFD700; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #191970; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .alert { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Booking Alert</h1>
            <p>SoulPath Astrology - Admin Notification</p>
        </div>
        <div class="content">
            <div class="alert">
                <h3>📋 New Client Booking Received</h3>
                <p>A new astrology reading has been booked. Please review the details below and schedule the session.</p>
            </div>

            <div class="booking-details">
                <h3>👤 Client Information</h3>
                <div class="detail-row"><span class="label">Name:</span> {{userName}}</div>
                <div class="detail-row"><span class="label">Email:</span> {{userEmail}}</div>
                <div class="detail-row"><span class="label">Booking ID:</span> {{bookingId}}</div>
                <div class="detail-row"><span class="label">Language:</span> {{language}}</div>
                <div class="detail-row"><span class="label">Submitted:</span> {{submissionDate}}</div>
            </div>

            <div class="booking-details">
                <h3>🌟 Birth Chart Details</h3>
                <div class="detail-row"><span class="label">Birth Date:</span> {{birthDate}}</div>
                <div class="detail-row"><span class="label">Birth Time:</span> {{birthTime}}</div>
                <div class="detail-row"><span class="label">Birth Place:</span> {{birthPlace}}</div>
                <div class="detail-row"><span class="label">Client's Question:</span> {{clientQuestion}}</div>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Review the client's birth chart information</li>
                <li>Schedule the session in the admin dashboard</li>
                <li>Send scheduling confirmation to the client</li>
                <li>Prepare personalized reading materials</li>
            </ul>

            <p>Login to the admin dashboard to manage this booking.</p>
        </div>
        <div class="footer">
            <p>© 2024 SoulPath Astrology - Admin System<br>
            Booking notification sent automatically</p>
        </div>
    </div>
</body>
</html>`,
        videoConferenceLink: {
          isActive: false,
          url: '',
          includeInTemplate: false
        }
      },
      es: {
        subject: 'Nueva Reserva Recibida - SoulPath Astrología',
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de Nueva Reserva</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #191970, #0A0A23); color: #FFD700; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #191970; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .alert { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Nueva Alerta de Reserva</h1>
            <p>SoulPath Astrología - Notificación Admin</p>
        </div>
        <div class="content">
            <div class="alert">
                <h3>📋 Nueva Reserva de Cliente Recibida</h3>
                <p>Se ha reservado una nueva lectura astrológica. Por favor revisa los detalles abajo y programa la sesión.</p>
            </div>

            <div class="booking-details">
                <h3>👤 Información del Cliente</h3>
                <div class="detail-row"><span class="label">Nombre:</span> {{userName}}</div>
                <div class="detail-row"><span class="label">Email:</span> {{userEmail}}</div>
                <div class="detail-row"><span class="label">ID de Reserva:</span> {{bookingId}}</div>
                <div class="detail-row"><span class="label">Idioma:</span> {{language}}</div>
                <div class="detail-row"><span class="label">Enviado:</span> {{submissionDate}}</div>
            </div>

            <div class="booking-details">
                <h3>🌟 Detalles de la Carta Natal</h3>
                <div class="detail-row"><span class="label">Fecha de Nacimiento:</span> {{birthDate}}</div>
                <div class="detail-row"><span class="label">Hora de Nacimiento:</span> {{birthTime}}</div>
                <div class="detail-row"><span class="label">Lugar de Nacimiento:</span> {{birthPlace}}</div>
                <div class="detail-row"><span class="label">Pregunta del Cliente:</span> {{clientQuestion}}</div>
            </div>

            <p><strong>Próximos Pasos:</strong></p>
            <ul>
                <li>Revisar la información de la carta natal del cliente</li>
                <li>Programar la sesión en el panel administrativo</li>
                <li>Enviar confirmación de programación al cliente</li>
                <li>Preparar materiales de lectura personalizados</li>
            </ul>

            <p>Inicia sesión en el panel administrativo para gestionar esta reserva.</p>
        </div>
        <div class="footer">
            <p>© 2024 SoulPath Astrología - Sistema Admin<br>
            Notificación de reserva enviada automáticamente</p>
        </div>
    </div>
</body>
</html>`,
        videoConferenceLink: {
          isActive: false,
          url: '',
          includeInTemplate: false
        }
      }
    }
  }), []);

  const loadEmailConfig = useCallback(async () => {
    try {
      const authToken = user?.access_token;
      if (!authToken) {
        console.error('No auth token available for loading email config');
        return;
      }

      console.log('Loading email config with auth token...');
      const response = await fetch(`/api/admin/email/config`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email config loaded successfully:', data);
        setEmailConfig(data.config || emailConfig);
      } else {
        console.error('Failed to load email config:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  }, [user?.access_token, emailConfig]);

  const loadEmailTemplates = useCallback(async () => {
    try {
      const authToken = user?.access_token;
      if (!authToken) {
        console.error('No auth token available for loading email templates');
        return;
      }

      console.log('Loading email templates with auth token...');
      const response = await fetch(`/api/admin/email/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email templates loaded successfully:', data);

        // Merge loaded templates with defaults, preferring loaded ones
        const mergedTemplates = { ...defaultTemplates };
        if (data.templates && Object.keys(data.templates).length > 0) {
          Object.assign(mergedTemplates, data.templates);
        }

        setEmailTemplates(mergedTemplates);
      } else {
        console.error('Failed to load email templates:', response.status, response.statusText);
        // Use default templates on error
        setEmailTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
      // Use default templates on error
      setEmailTemplates(defaultTemplates);
    }
  }, [user?.access_token, defaultTemplates]);

  // Load data on component mount - wait for user auth
  useEffect(() => {
    const initializeEmailManagement = async () => {
      if (user?.access_token) {
        console.log('User auth available, loading email data...');
        setIsLoading(true);
        setError('');
        try {
          await Promise.all([
            loadEmailConfig(),
            loadEmailTemplates()
          ]);
        } catch (error) {
          console.error('Error initializing email management:', error);
          setError('Failed to load email settings. Using defaults.');
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('No user authentication, using default templates...');
        // Use default templates when no auth
        setEmailTemplates(defaultTemplates);
        setIsLoading(false);
      }
    };

    initializeEmailManagement();
  }, [user?.access_token, loadEmailConfig, loadEmailTemplates, defaultTemplates]);








  const saveEmailConfig = async () => {
    if (!user?.access_token) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/email/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: emailConfig })
      });

      if (!response.ok) {
        throw new Error('Failed to save email config');
      }
      
      alert('Email configuration saved successfully!');
    } catch (error) {
      console.error('Error saving email config:', error);
      alert('Failed to save email configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEmailTemplates = async () => {
    if (!user?.access_token) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/email/templates`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates: emailTemplates })
      });

      if (!response.ok) {
        throw new Error('Failed to save email templates');
      }
      
      alert('Email templates saved successfully!');
    } catch (error) {
      console.error('Error saving email templates:', error);
      alert('Failed to save email templates. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailSending = async () => {
    if (!testEmail || !user?.access_token) return;
    
    try {
      setIsTesting(true);
      const response = await fetch(`/api/admin/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: testEmail,
          language: activeLanguage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }
      
      alert(`Test email sent successfully to ${testEmail}!`);
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email. Please check your configuration.');
    } finally {
      setIsTesting(false);
    }
  };

  // Fixed handlePreview function
  const handlePreview = () => {
    console.log('handlePreview called');
    try {
      if (!emailTemplates[activeTemplate]?.[activeLanguage]) {
        console.error('No template found for preview');
        setError('No template available for preview');
        return;
      }

      const template = emailTemplates[activeTemplate][activeLanguage];
      console.log('Template found:', template);
      
      // Replace placeholders with sample data for preview
      let previewContent = template.html;
      
      const sampleData = {
        '{{userName}}': 'María García',
        '{{userEmail}}': 'maria@example.com',
        '{{bookingId}}': 'BK-2024-001',
        '{{language}}': activeLanguage === 'en' ? 'English' : 'Español',
        '{{adminEmail}}': emailConfig.adminEmail || 'admin@soulpath.lat',
        '{{submissionDate}}': new Date().toLocaleDateString(),
        '{{birthDate}}': '1985-06-15',
        '{{birthTime}}': '14:30',
        '{{birthPlace}}': 'Lima, Peru',
        '{{clientQuestion}}': activeLanguage === 'en' ? 'What does my birth chart reveal about my career path?' : '¿Qué revela mi carta natal sobre mi camino profesional?',
        '{{bookingDate}}': '2024-01-15',
        '{{bookingTime}}': '15:00',
        '{{reminderDate}}': new Date().toLocaleDateString(),
        '{{VIDEO_LINK}}': 'https://meet.google.com/xyz-abc-def'
      };

      // Replace all placeholders
      Object.entries(sampleData).forEach(([placeholder, value]) => {
        previewContent = previewContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      // Handle conditional video link content
      const videoLinkSettings = template.videoConferenceLink;
      if (videoLinkSettings?.isActive && videoLinkSettings?.includeInTemplate) {
        // Show video link content
        previewContent = previewContent.replace(/\{\{#if videoConferenceLink\}\}/g, '');
        previewContent = previewContent.replace(/\{\{\/if\}\}/g, '');
      } else {
        // Remove video link content
        previewContent = previewContent.replace(/\{\{#if videoConferenceLink\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }

      console.log('Preview content prepared');
      setPreviewHtml(previewContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Error in handlePreview:', error);
      setError('Failed to generate preview');
    }
  };

  const updateTemplate = (field: string, value: string) => {
    setEmailTemplates(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        [activeLanguage]: {
          ...prev[activeTemplate][activeLanguage],
          [field]: value
        }
      }
    }));
  };

  const updateVideoLinkSettings = (field: string, value: string | boolean) => {
    setEmailTemplates(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        [activeLanguage]: {
          ...prev[activeTemplate][activeLanguage],
          videoConferenceLink: {
            ...prev[activeTemplate][activeLanguage].videoConferenceLink,
            [field]: value
          }
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const currentTemplate = emailTemplates[activeTemplate]?.[activeLanguage];

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Email Management</h1>
          <p className="dashboard-text-secondary">Configure email templates and settings for automated communications</p>
        </div>
        
        <div className="flex gap-2">
          <BaseButton
            onClick={saveEmailConfig}
            disabled={isSaving}
            className="dashboard-button-primary"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Config
        </BaseButton>
          
          <BaseButton
            onClick={saveEmailTemplates}
            disabled={isSaving}
            className="dashboard-button-primary"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Templates
          </BaseButton>
            </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-red-400">{error}</span>
      </div>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="dashboard-tabs">
          <TabsTrigger value="config" className="dashboard-tab">
            <Settings size={16} className="mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="templates" className="dashboard-tab">
            <Mail size={16} className="mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="test" className="dashboard-tab">
            <TestTube size={16} className="mr-2" />
            Testing
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card className="dashboard-card">
        <CardHeader>
              <CardTitle className="dashboard-card-title flex items-center space-x-2">
                <Settings size={20} />
                <span>Email Service Configuration</span>
              </CardTitle>
        </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#C0C0C0]">Brevo API Key</Label>
                    <BaseInput
                type="password"
                value={emailConfig.brevoApiKey}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, brevoApiKey: e.target.value }))}
                      placeholder="Enter your Brevo API key"
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
              />
            </div>
            
                  <div>
                    <Label className="text-[#C0C0C0]">Sender Email</Label>
                    <BaseInput
                type="email"
                value={emailConfig.senderEmail}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="noreply@yourdomain.com"
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
              />
                  </div>
            </div>
            
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#C0C0C0]">Sender Name</Label>
                    <BaseInput
                value={emailConfig.senderName}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="SoulPath Astrology"
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
              />
            </div>
            
                  <div>
                    <Label className="text-[#C0C0C0]">Admin Email</Label>
                    <BaseInput
                type="email"
                value={emailConfig.adminEmail}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@yourdomain.com"
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
              />
                  </div>
            </div>
          </div>
          
              {/* Video Conference Settings */}
              <div className="space-y-4 border-t border-[#C0C0C0]/20 pt-6">
                <h3 className="text-[#EAEAEA] font-heading text-lg flex items-center space-x-2">
                  <Video size={18} />
                  <span>Default Video Conference Links</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#C0C0C0]">English Sessions</Label>
                    <BaseInput
                      value={emailConfig.defaultVideoLinks?.en || ''}
                      onChange={(e) => setEmailConfig(prev => ({ 
                        ...prev, 
                        defaultVideoLinks: { 
                          ...prev.defaultVideoLinks, 
                          en: e.target.value 
                        } 
                      }))}
                      placeholder="https://meet.google.com/your-room-en"
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                    />
          </div>
          
                  <div>
                    <Label className="text-[#C0C0C0]">Spanish Sessions</Label>
                    <BaseInput
                      value={emailConfig.defaultVideoLinks?.es || ''}
                      onChange={(e) => setEmailConfig(prev => ({ 
                        ...prev, 
                        defaultVideoLinks: { 
                          ...prev.defaultVideoLinks, 
                          es: e.target.value 
                        } 
                      }))}
                      placeholder="https://meet.google.com/your-room-es"
                      className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                    />
            </div>
            </div>
              </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Template Selector */}
            <div className="lg:col-span-1">
              <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
        <CardHeader>
                  <CardTitle className="text-[#EAEAEA] text-sm">Templates</CardTitle>
        </CardHeader>
                <CardContent className="space-y-2">
                  {Object.keys(emailTemplates).map((templateKey) => (
                    <button
                      key={templateKey}
                      onClick={() => setActiveTemplate(templateKey)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        activeTemplate === templateKey
                          ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                          : 'text-[#C0C0C0] hover:text-[#EAEAEA] hover:bg-[#C0C0C0]/5'
                      }`}
                    >
                      {templateKey === 'userBookingConfirmation' && '📧 User Confirmation'}
                      {templateKey === 'adminBookingNotification' && '🔔 Admin Notification'}
                      {templateKey === 'bookingReminder' && '⏰ Booking Reminder'}
                    </button>
                  ))}
                  
                  {/* Language Selector */}
                  <div className="pt-4 border-t border-[#C0C0C0]/20">
                    <Label className="text-[#C0C0C0] text-xs">Language</Label>
                    <div className="flex bg-[#0A0A23]/50 rounded-lg p-1 mt-1">
                      <button
                        onClick={() => setActiveLanguage('en')}
                        className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                          activeLanguage === 'en'
                            ? 'bg-[#FFD700] text-[#0A0A23]'
                            : 'text-[#C0C0C0] hover:text-[#FFD700]'
                        }`}
                      >
                        🇺🇸 EN
                      </button>
                      <button
                        onClick={() => setActiveLanguage('es')}
                        className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                          activeLanguage === 'es'
                            ? 'bg-[#FFD700] text-[#0A0A23]'
                            : 'text-[#C0C0C0] hover:text-[#FFD700]'
                        }`}
                      >
                        🇪🇸 ES
                      </button>
                    </div>
          </div>
        </CardContent>
      </Card>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-3">
              <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
        <CardHeader>
                  <CardTitle className="text-[#EAEAEA] flex items-center justify-between">
                    <span>Edit Template - {activeLanguage === 'en' ? 'English' : 'Español'}</span>
                    <div className="flex items-center space-x-2">
                      <BaseButton
                        onClick={() => setShowPlaceholderHelper(!showPlaceholderHelper)}
                        variant="outline"
                        size="sm"
                        className="border-[#C0C0C0]/30 text-[#C0C0C0] hover:bg-[#C0C0C0]/10"
                      >
                        <Info size={14} className="mr-1" />
                        Placeholders
                      </BaseButton>
                      <BaseButton
                        onClick={handlePreview}
                        variant="outline"
                        size="sm"
                        className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        <Eye size={14} className="mr-1" />
                        Preview
                      </BaseButton>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentTemplate && (
                    <>
                      {/* Subject */}
                      <div>
                        <Label className="text-[#C0C0C0]">Subject Line</Label>
                        <BaseInput
                          value={currentTemplate.subject || ''}
                          onChange={(e) => updateTemplate('subject', e.target.value)}
                          className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                        />
                  </div>

                      {/* Video Conference Settings */}
                      <div className="space-y-3 border border-[#C0C0C0]/20 rounded-lg p-4">
                        <h4 className="text-[#EAEAEA] font-medium flex items-center space-x-2">
                          <Video size={16} />
                          <span>Video Conference Settings</span>
                        </h4>
                        
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={currentTemplate.videoConferenceLink?.isActive || false}
                            onCheckedChange={(checked) => updateVideoLinkSettings('isActive', checked)}
                          />
                          <Label className="text-[#C0C0C0]">Enable video conference links</Label>
                  </div>

                        {currentTemplate.videoConferenceLink?.isActive && (
                          <>
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={currentTemplate.videoConferenceLink?.includeInTemplate !== false}
                                onCheckedChange={(checked) => updateVideoLinkSettings('includeInTemplate', checked)}
                              />
                              <Label className="text-[#C0C0C0]">Include video link in template</Label>
                    </div>
                            
                            <div>
                              <Label className="text-[#C0C0C0]">Default Video Conference URL</Label>
                              <BaseInput
                                value={currentTemplate.videoConferenceLink?.url || ''}
                                onChange={(e) => updateVideoLinkSettings('url', e.target.value)}
                                placeholder="https://meet.google.com/your-room"
                                className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                              />
                    </div>
                          </>
                  )}
                </div>

                      {/* HTML Content */}
                      <div>
                        <Label className="text-[#C0C0C0]">HTML Content</Label>
                        <Textarea
                          value={currentTemplate.html || ''}
                          onChange={(e) => updateTemplate('html', e.target.value)}
                          className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] min-h-[400px] font-mono text-sm"
                          placeholder="Enter your HTML email template..."
                        />
                </div>
                    </>
          )}
        </CardContent>
      </Card>
        </div>
          </div>

          {/* Placeholder Helper */}
      <AnimatePresence>
            {showPlaceholderHelper && (
          <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
                  <CardHeader>
                    <CardTitle className="text-[#EAEAEA] text-lg">Available Placeholders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(AVAILABLE_PLACEHOLDERS).map(([category, placeholders]) => (
                        <div key={category}>
                          <h4 className="text-[#FFD700] font-medium mb-2 capitalize">{category}</h4>
                          <div className="space-y-1">
                            {placeholders.map((placeholder) => (
                              <div 
                                key={placeholder.key} 
                                className={`text-xs p-2 rounded bg-[#0A0A23]/50 border ${
                                  placeholder.isNew ? 'border-[#FFD700]/50 bg-[#FFD700]/5' : 'border-[#C0C0C0]/20'
                                }`}
                              >
                                <code className="text-[#FFD700]">{placeholder.key}</code>
                                <p className="text-[#C0C0C0] mt-1">{placeholder.description}</p>
                                {placeholder.isNew && (
                                  <Badge className="mt-1 bg-[#FFD700] text-[#0A0A23] text-xs">NEW</Badge>
                                )}
                                {placeholder.isConditional && (
                                  <Badge className="mt-1 bg-blue-500 text-white text-xs">CONDITIONAL</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
          </motion.div>
        )}
      </AnimatePresence>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="test">
          <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
            <CardHeader>
              <CardTitle className="text-[#EAEAEA] flex items-center space-x-2">
                <TestTube size={20} />
                <span>Email Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#C0C0C0]">Test Email Address</Label>
                  <BaseInput
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                  />
                </div>
                
                <div>
                  <Label className="text-[#C0C0C0]">Template</Label>
                  <Select value={activeTemplate} onValueChange={setActiveTemplate}>
                    <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="userBookingConfirmation">User Confirmation</SelectItem>
                      <SelectItem value="adminBookingNotification">Admin Notification</SelectItem>
                      <SelectItem value="bookingReminder">Booking Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#C0C0C0]">Language</Label>
                  <Select value={activeLanguage} onValueChange={(value: 'en' | 'es') => setActiveLanguage(value)}>
                    <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <BaseButton
                onClick={testEmailSending}
                disabled={isTesting || !testEmail}
                className="dashboard-button-primary"
              >
                {isTesting ? (
            <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-[#0A0A23] border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                Send Test Email
              </BaseButton>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-[#0A0A23] rounded-lg border border-[#C0C0C0]/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#C0C0C0]/20">
                <h3 className="text-[#EAEAEA] font-heading text-lg">Email Preview</h3>
                <BaseButton
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  size="sm"
                  className="text-[#C0C0C0] hover:text-[#EAEAEA]"
                >
                  <X size={20} />
                </BaseButton>
              </div>
              
              <div className="p-4 h-[calc(90vh-80px)] overflow-auto">
                <div className="bg-white rounded-lg">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[600px] rounded-lg"
                    title="Email Preview"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}