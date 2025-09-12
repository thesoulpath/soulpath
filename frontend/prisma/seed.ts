import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // 1. Create communication configuration
  console.log('📧 Creating communication configuration...');
  const communicationConfig = await prisma.communicationConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      email_enabled: true,
      brevo_api_key: '',
      sender_email: 'noreply@soulpath.lat',
      sender_name: 'SOULPATH',
      admin_email: 'admin@soulpath.lat',
      sms_enabled: false,
      sms_provider: 'labsmobile',
      labsmobile_username: '',
      labsmobile_token: '',
      sms_sender_name: 'SoulPath'
    }
  });
  console.log('✅ Communication config created:', communicationConfig.id);

  // 2. Create communication templates (email and SMS)
  console.log('📝 Creating communication templates...');
  const communicationTemplates = await Promise.all([
    // Booking Confirmation Templates
    prisma.communicationTemplate.upsert({
      where: { templateKey: 'booking_confirmation' },
      update: {},
      create: {
        templateKey: 'booking_confirmation',
        name: 'Booking Confirmation',
        description: 'Sent when a booking is confirmed',
        type: 'email',
        category: 'booking',
        isActive: true,
        isDefault: true,
        translations: {
          create: [
            {
              language: 'en',
              subject: 'Booking Confirmation - SOULPATH',
              content: '<h1>Your session has been confirmed!</h1><p>Dear {{clientName}},</p><p>Your {{sessionType}} session is scheduled for {{sessionDate}} at {{sessionTime}}.</p><p>We look forward to seeing you at SOULPATH!</p><p>Best regards,<br>SOULPATH Team</p>'
            },
            {
              language: 'es',
              subject: 'Confirmación de Reserva - SOULPATH',
              content: '<h1>¡Tu sesión ha sido confirmada!</h1><p>Estimado {{clientName}},</p><p>Tu sesión de {{sessionType}} está programada para el {{sessionDate}} a las {{sessionTime}}.</p><p>¡Esperamos verte en SOULPATH!</p><p>Atentamente,<br>Equipo SOULPATH</p>'
            }
          ]
        }
      }
    }),

    // Session Reminder Templates
    prisma.communicationTemplate.upsert({
      where: { templateKey: 'session_reminder' },
      update: {},
      create: {
        templateKey: 'session_reminder',
        name: 'Session Reminder',
        description: 'Sent before upcoming sessions',
        type: 'email',
        category: 'booking',
        isActive: true,
        isDefault: true,
        translations: {
          create: [
            {
              language: 'en',
              subject: 'Session Reminder - SOULPATH',
              content: '<h1>Session Reminder</h1><p>Dear {{clientName}},</p><p>This is a reminder for your {{sessionType}} session tomorrow at {{sessionTime}}.</p><p>Please arrive 10 minutes early for your appointment.</p><p>Best regards,<br>SOULPATH Team</p>'
            },
            {
              language: 'es',
              subject: 'Recordatorio de Sesión - SOULPATH',
              content: '<h1>Recordatorio de Sesión</h1><p>Estimado {{clientName}},</p><p>Este es un recordatorio para tu sesión de {{sessionType}} mañana a las {{sessionTime}}.</p><p>Por favor llega 10 minutos antes a tu cita.</p><p>Atentamente,<br>Equipo SOULPATH</p>'
            }
          ]
        }
      }
    }),

    // Welcome Email Templates
    prisma.communicationTemplate.upsert({
      where: { templateKey: 'welcome_email' },
      update: {},
      create: {
        templateKey: 'welcome_email',
        name: 'Welcome Email',
        description: 'Sent to new clients after registration',
        type: 'email',
        category: 'welcome',
        isActive: true,
        isDefault: true,
        translations: {
          create: [
            {
              language: 'en',
              subject: 'Welcome to SOULPATH',
              content: '<h1>Welcome to SOULPATH!</h1><p>Dear {{clientName}},</p><p>Thank you for choosing SOULPATH. We are excited to be part of your wellness journey.</p><p>Discover our services and book your first session today.</p><p>Best regards,<br>SOULPATH Team</p>'
            },
            {
              language: 'es',
              subject: 'Bienvenido a SOULPATH',
              content: '<h1>¡Bienvenido a SOULPATH!</h1><p>Estimado {{clientName}},</p><p>Gracias por elegir SOULPATH. Estamos emocionados de ser parte de tu camino al bienestar.</p><p>Descubre nuestros servicios y reserva tu primera sesión hoy.</p><p>Atentamente,<br>Equipo SOULPATH</p>'
            }
          ]
        }
      }
    }),

    // OTP Verification SMS Templates
    prisma.communicationTemplate.upsert({
      where: { templateKey: 'otp_verification' },
      update: {},
      create: {
        templateKey: 'otp_verification',
        name: 'OTP Verification',
        description: 'SMS sent for phone number verification',
        type: 'sms',
        category: 'verification',
        isActive: true,
        isDefault: true,
        translations: {
          create: [
            {
              language: 'en',
              content: 'Your SOULPATH verification code is {{otpCode}}. This code expires in {{expiryTime}} minutes.'
            },
            {
              language: 'es',
              content: 'Tu código de verificación de SOULPATH es {{otpCode}}. Este código expira en {{expiryTime}} minutos.'
            }
          ]
        }
      }
    }),

    // Payment Confirmation SMS Templates
    prisma.communicationTemplate.upsert({
      where: { templateKey: 'payment_confirmation' },
      update: {},
      create: {
        templateKey: 'payment_confirmation',
        name: 'Payment Confirmation',
        description: 'SMS sent after successful payment',
        type: 'sms',
        category: 'payment',
        isActive: true,
        isDefault: true,
        translations: {
          create: [
            {
              language: 'en',
              content: 'Payment confirmed! Your {{packageName}} package has been activated. Amount: ${{amount}}. Thank you for choosing SOULPATH!'
            },
            {
              language: 'es',
              content: '¡Pago confirmado! Tu paquete {{packageName}} ha sido activado. Monto: ${{amount}}. ¡Gracias por elegir SOULPATH!'
            }
          ]
        }
      }
    }),

    // Appointment Cancellation Templates
    prisma.communicationTemplate.upsert({
      where: { templateKey: 'appointment_cancelled' },
      update: {},
      create: {
        templateKey: 'appointment_cancelled',
        name: 'Appointment Cancelled',
        description: 'Sent when an appointment is cancelled',
        type: 'email',
        category: 'booking',
        isActive: true,
        isDefault: true,
        translations: {
          create: [
            {
              language: 'en',
              subject: 'Appointment Cancelled - SOULPATH',
              content: '<h1>Appointment Cancelled</h1><p>Dear {{clientName}},</p><p>Your {{sessionType}} session scheduled for {{sessionDate}} at {{sessionTime}} has been cancelled.</p><p>You can reschedule at any time through your dashboard.</p><p>Best regards,<br>SOULPATH Team</p>'
            },
            {
              language: 'es',
              subject: 'Cita Cancelada - SOULPATH',
              content: '<h1>Cita Cancelada</h1><p>Estimado {{clientName}},</p><p>Tu sesión de {{sessionType}} programada para el {{sessionDate}} a las {{sessionTime}} ha sido cancelada.</p><p>Puedes reprogramar en cualquier momento a través de tu panel de control.</p><p>Atentamente,<br>Equipo SOULPATH</p>'
            }
          ]
        }
      }
    })
  ]);
  console.log('✅ Communication templates created:', communicationTemplates.length);

  // 3. Create content
  console.log('📄 Creating website content...');
  const content = await prisma.content.upsert({
    where: { id: 1 },
    update: {},
    create: {
      heroTitleEn: 'Welcome to SOULPATH',
      heroTitleEs: 'Bienvenido a SOULPATH',
      heroSubtitleEn: 'Your journey to wellness starts here',
      heroSubtitleEs: 'Tu camino al bienestar comienza aquí',
      aboutTitleEn: 'About Us',
      aboutTitleEs: 'Sobre Nosotros',
      aboutContentEn: 'We are dedicated to helping you achieve your wellness goals.',
      aboutContentEs: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
      approachTitleEn: 'Our Approach',
      approachTitleEs: 'Nuestro Enfoque',
      approachContentEn: 'We use a holistic approach to wellness.',
      approachContentEs: 'Usamos un enfoque holístico para el bienestar.',
      servicesTitleEn: 'Our Services',
      servicesTitleEs: 'Nuestros Servicios',
      servicesContentEn: 'Professional wellness services in a peaceful environment.',
      servicesContentEs: 'Servicios profesionales de bienestar en un ambiente pacífico.'
    }
  });
  console.log('✅ Content created:', content.id);

  // 4. Create logo settings
  console.log('🎨 Creating logo settings...');
  const logoSettings = await prisma.logoSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'text',
      text: 'SOULPATH',
      imageUrl: null
    }
  });
  console.log('✅ Logo settings created:', logoSettings.id);

  // 5. Create SEO settings
  console.log('🔍 Creating SEO settings...');
  const seo = await prisma.seo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'SOULPATH - Wellness & Healing',
      description: 'Your journey to wellness starts here. Professional wellness services in a peaceful environment.',
      keywords: 'wellness, healing, therapy, meditation, soulpath',
      ogImage: null
    }
  });
  console.log('✅ SEO settings created:', seo.id);

  // 6. Create currencies
  console.log('💰 Creating currencies...');
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        is_default: true,
        exchange_rate: 1.000000
      }
    }),
    prisma.currency.upsert({
      where: { code: 'EUR' },
      update: {},
      create: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        is_default: false,
        exchange_rate: 0.850000
      }
    }),
    prisma.currency.upsert({
      where: { code: 'MXN' },
      update: {},
      create: {
        code: 'MXN',
        name: 'Mexican Peso',
        symbol: 'MXN$',
        is_default: false,
        exchange_rate: 18.500000
      }
    }),
    prisma.currency.upsert({
      where: { code: 'CAD' },
      update: {},
      create: {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        is_default: false,
        exchange_rate: 1.350000
      }
    })
  ]);
  console.log('✅ Currencies created:', currencies.length);

  // 7. Create session durations
  console.log('⏱️ Creating session durations...');
  const sessionDurations = await Promise.all([
    prisma.sessionDuration.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '30 Minutes',
        duration_minutes: 30,
        description: 'Quick wellness session',
        isActive: true
      }
    }),
    prisma.sessionDuration.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '60 Minutes',
        duration_minutes: 60,
        description: 'Standard wellness session',
        isActive: true
      }
    }),
    prisma.sessionDuration.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '90 Minutes',
        duration_minutes: 90,
        description: 'Extended wellness session',
        isActive: true
      }
    }),
    prisma.sessionDuration.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '120 Minutes',
        duration_minutes: 120,
        description: 'Comprehensive wellness session',
        isActive: true
      }
    })
  ]);
  console.log('✅ Session durations created:', sessionDurations.length);

  // 8. Create rates
  console.log('💵 Creating rates...');
  const rates = await Promise.all([
    // Individual session rates
    prisma.rate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 1, // 30 minutes
        sessionType: 'individual',
        base_price: 50.00,
        group_discount_percent: 0,
        min_group_size: 1,
        max_group_size: 1,
        isActive: true
      }
    }),
    prisma.rate.upsert({
      where: { id: 2 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 2, // 60 minutes
        sessionType: 'individual',
        base_price: 80.00,
        group_discount_percent: 0,
        min_group_size: 1,
        max_group_size: 1,
        isActive: true
      }
    }),
    prisma.rate.upsert({
      where: { id: 3 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 3, // 90 minutes
        sessionType: 'individual',
        base_price: 120.00,
        group_discount_percent: 0,
        min_group_size: 1,
        max_group_size: 1,
        isActive: true
      }
    }),
    // Group session rates
    prisma.rate.upsert({
      where: { id: 4 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 2, // 60 minutes
        sessionType: 'group',
        base_price: 60.00,
        group_discount_percent: 25.00,
        min_group_size: 2,
        max_group_size: 5,
        isActive: true
      }
    })
  ]);
  console.log('✅ Rates created:', rates.length);

  // 9. Create package definitions
  console.log('📦 Creating package definitions...');
  const packageDefinitions = await Promise.all([
    prisma.packageDefinition.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Starter Package',
        description: 'Perfect for beginners',
        sessionsCount: 3,
        sessionDurationId: 2, // 60 minutes
        packageType: 'individual',
        maxGroupSize: 1,
        isActive: true
      }
    }),
    prisma.packageDefinition.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Wellness Package',
        description: 'Comprehensive wellness program',
        sessionsCount: 6,
        sessionDurationId: 2, // 60 minutes
        packageType: 'individual',
        maxGroupSize: 1,
        isActive: true
      }
    }),
    prisma.packageDefinition.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Group Wellness',
        description: 'Group wellness sessions',
        sessionsCount: 4,
        sessionDurationId: 2, // 60 minutes
        packageType: 'group',
        maxGroupSize: 5,
        isActive: true
      }
    })
  ]);
  console.log('✅ Package definitions created:', packageDefinitions.length);

  // 10. Create package prices
  console.log('💲 Creating package prices...');
  const packagePrices = await Promise.all([
    prisma.packagePrice.upsert({
      where: { id: 1 },
      update: {},
      create: {
        packageDefinitionId: 1, // Starter Package
        currencyId: 1, // USD
        price: 200.00,
        pricingMode: 'custom',
        isActive: true
      }
    }),
    prisma.packagePrice.upsert({
      where: { id: 2 },
      update: {},
      create: {
        packageDefinitionId: 2, // Wellness Package
        currencyId: 1, // USD
        price: 400.00,
        pricingMode: 'custom',
        isActive: true
      }
    }),
    prisma.packagePrice.upsert({
      where: { id: 3 },
      update: {},
      create: {
        packageDefinitionId: 3, // Group Wellness
        currencyId: 1, // USD
        price: 180.00,
        pricingMode: 'custom',
        isActive: true
      }
    })
  ]);
  console.log('✅ Package prices created:', packagePrices.length);

  // 11. Create schedule templates
  console.log('📅 Creating schedule templates...');
  const scheduleTemplates = await Promise.all([
    prisma.scheduleTemplate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 2 },
      update: {},
      create: {
        dayOfWeek: 'Tuesday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 3 },
      update: {},
      create: {
        dayOfWeek: 'Wednesday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 4 },
      update: {},
      create: {
        dayOfWeek: 'Thursday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 5 },
      update: {},
      create: {
        dayOfWeek: 'Friday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 6 },
      update: {},
      create: {
        dayOfWeek: 'Saturday',
        startTime: '10:00',
        endTime: '16:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    })
  ]);
  console.log('✅ Schedule templates created:', scheduleTemplates.length);

  // 12. Create schedule slots (for backward compatibility)
  console.log('📅 Creating schedule slots...');
  const scheduleSlots = await Promise.all([
    prisma.scheduleSlot.upsert({
      where: { id: 1 },
      update: {},
      create: {
        scheduleTemplateId: 1, // Monday template
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T17:00:00Z'),
        capacity: 3,
        bookedCount: 0,
        isAvailable: true
      }
    }),
    prisma.scheduleSlot.upsert({
      where: { id: 2 },
      update: {},
      create: {
        scheduleTemplateId: 2, // Tuesday template
        startTime: new Date('2024-01-02T09:00:00Z'),
        endTime: new Date('2024-01-02T17:00:00Z'),
        capacity: 3,
        bookedCount: 0,
        isAvailable: true
      }
    })
  ]);
  console.log('✅ Schedule slots created:', scheduleSlots.length);

  // 13. Create payment method configurations
  console.log('💳 Creating payment method configurations...');
  const paymentMethods = await Promise.all([
    prisma.paymentMethodConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Stripe',
        type: 'stripe',
        isActive: true,
        description: 'Credit card payments via Stripe',
        icon: 'credit-card',
        requiresConfirmation: false,
        autoAssignPackage: true
      }
    }),
    prisma.paymentMethodConfig.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Cash',
        type: 'cash',
        isActive: true,
        description: 'Cash payments',
        icon: 'dollar-sign',
        requiresConfirmation: true,
        autoAssignPackage: false
      }
    }),
    prisma.paymentMethodConfig.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Bank Transfer',
        type: 'bank_transfer',
        isActive: true,
        description: 'Bank transfer payments',
        icon: 'building',
        requiresConfirmation: true,
        autoAssignPackage: false
      }
    })
  ]);
  console.log('✅ Payment methods created:', paymentMethods.length);

  // 13.5. Create payment methods (actual payment_methods table)
  console.log('💳 Creating payment methods...');
  const paymentMethodsData = await Promise.all([
    prisma.payment_methods.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Stripe Credit Card',
        description: 'Secure online credit card payments via Stripe',
        currency_id: 1, // USD
        is_active: true
      }
    }),
    prisma.payment_methods.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Cash Payment',
        description: 'In-person cash payments',
        currency_id: 1, // USD
        is_active: true
      }
    }),
    prisma.payment_methods.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Bank Transfer',
        description: 'Direct bank transfer payments',
        currency_id: 1, // USD
        is_active: true
      }
    }),
    prisma.payment_methods.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'PayPal',
        description: 'PayPal online payments',
        currency_id: 1, // USD
        is_active: true
      }
    }),
    prisma.payment_methods.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: 'Mexican Peso Cash',
        description: 'Cash payments in Mexican Peso',
        currency_id: 3, // MXN
        is_active: true
      }
    })
  ]);
  console.log('✅ Payment methods created:', paymentMethodsData.length);

  // 14. Create group booking tiers
  console.log('👥 Creating group booking tiers...');
  const groupBookingTiers = await Promise.all([
    prisma.group_booking_tiers.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Small Group (2-3 people)',
        min_participants: 2,
        max_participants: 3,
        discount_percent: 15.00,
        description: 'Small group discount',
        is_active: true
      }
    }),
    prisma.group_booking_tiers.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Medium Group (4-6 people)',
        min_participants: 4,
        max_participants: 6,
        discount_percent: 25.00,
        description: 'Medium group discount',
        is_active: true
      }
    }),
    prisma.group_booking_tiers.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Large Group (7+ people)',
        min_participants: 7,
        max_participants: 10,
        discount_percent: 35.00,
        description: 'Large group discount',
        is_active: true
      }
    })
  ]);
  console.log('✅ Group booking tiers created:', groupBookingTiers.length);

  // 15. Create legacy soul packages (for backward compatibility)
  console.log('📦 Creating legacy soul packages...');
  // Legacy soul packages are now handled by PackageDefinition and PackagePrice models
  console.log('✅ Legacy soul packages are handled by PackageDefinition and PackagePrice models');

  // 16. Create test clients
  console.log('👥 Creating test clients...');
  const clients = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        phone: '+1234567890',
        status: 'active',
        birthDate: new Date('1990-01-15'),
        birthTime: new Date('1990-01-15T10:30:00'),
        birthPlace: 'New York, USA',
        question: 'How can I improve my overall wellness?',
        language: 'en'
      }
    }),
    prisma.user.upsert({
      where: { email: 'maria.garcia@example.com' },
      update: {},
      create: {
        email: 'maria.garcia@example.com',
        fullName: 'Maria Garcia',
        phone: '+1234567891',
        status: 'active',
        birthDate: new Date('1985-06-20'),
        birthTime: new Date('1985-06-20T14:15:00'),
        birthPlace: 'Madrid, Spain',
        question: '¿Cómo puedo manejar mejor el estrés?',
        language: 'es'
      }
    }),
    prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        fullName: 'Test Client',
        phone: '+1234567892',
        status: 'active',
        birthDate: new Date('1995-03-10'),
        birthTime: new Date('1995-03-10T09:00:00'),
        birthPlace: 'Toronto, Canada',
        question: 'What wellness services do you offer?',
        language: 'en'
      }
    })
  ]);
  console.log('✅ Test clients created:', clients.length);

  // 16.5. Create admin client profile
  console.log('👤 Creating admin client profile...');
  const adminClient = await prisma.user.upsert({
    where: { email: 'coco@soulpath.lat' },
    update: {},
    create: {
      email: 'coco@soulpath.lat',
      fullName: 'Coco Admin',
      phone: '+1234567890',
      status: 'active',
      birthDate: new Date('1990-01-15'),
      birthTime: new Date('1990-01-15T10:30:00'),
      birthPlace: 'New York, USA',
      question: 'How can I help manage the SOULPATH wellness system?',
      language: 'en'
    }
  });
  console.log('✅ Admin client profile created:', adminClient.id);

  // 16.6. Create new admin user with password
  console.log('👤 Creating new admin user (beto@soulpath.lat)...');
  const hashedPassword = await bcrypt.hash('soulpath', 12);
  const newAdminUser = await prisma.user.upsert({
    where: { email: 'beto@soulpath.lat' },
    update: {},
    create: {
      email: 'beto@soulpath.lat',
      password: hashedPassword,
      fullName: 'Beto Admin',
      role: 'admin',
      phone: '+1234567890',
      status: 'active',
      birthDate: new Date('1990-01-15'),
      birthTime: new Date('1990-01-15T10:30:00'),
      birthPlace: 'New York, USA',
      question: 'How can I help manage the SOULPATH wellness system?',
      language: 'en',
      adminNotes: 'System administrator with full access'
    }
  });
  console.log('✅ New admin user created:', newAdminUser.email);

  // 17. Create test purchases first
  console.log('💳 Creating test purchases...');
  const purchases = await Promise.all([
    prisma.purchase.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: clients[0].id,
        totalAmount: 200.00,
        currencyCode: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'confirmed',
        transactionId: 'txn_test_123',
        notes: 'Test purchase for John Doe',
        purchasedAt: new Date(),
        confirmedAt: new Date()
      }
    }),
    prisma.purchase.upsert({
      where: { id: 2 },
      update: {},
      create: {
        userId: clients[1].id,
        totalAmount: 360.00,
        currencyCode: 'USD',
        paymentMethod: 'cash',
        paymentStatus: 'confirmed',
        transactionId: 'txn_test_456',
        notes: 'Test purchase for Maria Garcia',
        purchasedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    })
  ]);
  console.log('✅ Test purchases created:', purchases.length);

  // 18. Create test user packages
  console.log('📦 Creating test user packages...');
  const userPackages = await Promise.all([
    prisma.userPackage.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: clients[0].id,
        purchaseId: 1,
        packagePriceId: 1,
        quantity: 1,
        sessionsUsed: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      }
    }),
    prisma.userPackage.upsert({
      where: { id: 2 },
      update: {},
      create: {
        userId: clients[1].id,
        purchaseId: 2,
        packagePriceId: 2,
        quantity: 1,
        sessionsUsed: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      }
    })
  ]);
  console.log('✅ Test user packages created:', userPackages.length);

  // 19. Create test bookings
  console.log('📋 Creating test bookings...');
  const bookings = await Promise.all([
    prisma.booking.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: clients[0].id,
        userPackageId: 1,
        scheduleSlotId: 1,
        sessionType: 'Wellness Session',
        status: 'confirmed',
        notes: 'Test booking for development'
      }
    }),
    prisma.booking.upsert({
      where: { id: 2 },
      update: {},
      create: {
        userId: clients[1].id,
        userPackageId: 2,
        scheduleSlotId: 2,
        sessionType: 'Wellness Session',
        status: 'confirmed',
        notes: 'Sesión en español'
      }
    })
  ]);
  console.log('✅ Test bookings created:', bookings.length);

  // 19. Create comprehensive payment records and purchase history
  console.log('💳 Creating comprehensive payment records...');
  const paymentRecords = await Promise.all([
    // John Doe's payment history
    prisma.paymentRecord.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: clients[0].id,
        purchaseId: 1,
        amount: 200.00,
        currencyCode: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'confirmed',
        transactionId: 'txn_123456789',
        notes: 'Starter package payment - Credit card',
        paymentDate: new Date(),
        confirmedAt: new Date()
      }
    }),
    // Maria Garcia's payment history
    prisma.paymentRecord.upsert({
      where: { id: 2 },
      update: {},
      create: {
        userId: clients[1].id,
        purchaseId: 2,
        amount: 360.00,
        currencyCode: 'USD',
        paymentMethod: 'cash',
        paymentStatus: 'confirmed',
        transactionId: null,
        notes: 'Wellness package payment - Cash',
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    })
  ]);
  console.log('✅ Payment records created:', paymentRecords.length);

  // 20. Profile model doesn't exist - skipping
  console.log('👤 Profile model doesn\'t exist - skipping');

  // 21. Create profile image
  console.log('🖼️ Creating profile image...');
  const profileImage = await prisma.profileImage.upsert({
    where: { key: 'hero_profile' },
    update: {},
    create: {
      key: 'hero_profile',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      altText: 'Jose Profile - SOULPATH Wellness'
    }
  });
  console.log('✅ Profile image created:', profileImage.id);

  // 22. Create test images
  console.log('🖼️ Creating test images...');
  const images = await Promise.all([
    prisma.image.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Wellness Center',
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        altText: 'Peaceful wellness center environment',
        category: 'facility'
      }
    }),
    prisma.image.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Meditation Room',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        altText: 'Tranquil meditation room',
        category: 'facility'
      }
    }),
    prisma.image.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Wellness Session',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
        altText: 'Professional wellness session',
        category: 'service'
      }
    })
  ]);
  console.log('✅ Test images created:', images.length);

  // 23. Create test bug reports
  console.log('🐛 Creating test bug reports...');
  const bugReports = await Promise.all([
    prisma.bugReport.upsert({
      where: { id: 'bug-001' },
      update: {},
      create: {
        id: 'bug-001',
        title: 'Payment form not working',
        description: 'The Stripe payment form is not loading properly on mobile devices.',
        screenshot: null,
        status: 'OPEN',
        priority: 'HIGH',
        category: 'Payment System',
        reporterId: clients[0].id,
        assignedTo: null
      }
    }),
    prisma.bugReport.upsert({
      where: { id: 'bug-002' },
      update: {},
      create: {
        id: 'bug-002',
        title: 'Email notifications not sending',
        description: 'Booking confirmation emails are not being sent to clients.',
        screenshot: null,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Email System',
        reporterId: clients[1].id,
        assignedTo: adminClient.id
      }
    })
  ]);
  console.log('✅ Test bug reports created:', bugReports.length);

  // 24. Create test bug comments
  console.log('💬 Creating test bug comments...');
  const bugComments = await Promise.all([
    prisma.bugComment.upsert({
      where: { id: 'comment-001' },
      update: {},
      create: {
        id: 'comment-001',
        content: 'This issue has been reported by multiple users. Need to investigate the mobile payment flow.',
        authorId: adminClient.id,
        bugReportId: 'bug-001'
      }
    }),
    prisma.bugComment.upsert({
      where: { id: 'comment-002' },
      update: {},
      create: {
        id: 'comment-002',
        content: 'Working on fixing the email configuration. Should be resolved by tomorrow.',
        authorId: adminClient.id,
        bugReportId: 'bug-002'
      }
    })
  ]);
  console.log('✅ Test bug comments created:', bugComments.length);

  console.log('');
  console.log('🎉 Comprehensive database seeding completed successfully!');
  console.log('');
  console.log('📊 Created:');
  console.log(`   📧 Communication config: ${communicationConfig.id}`);
  console.log(`   📝 Communication templates: ${communicationTemplates.length}`);
  console.log(`   📄 Content: ${content.id}`);
  console.log(`   🎨 Logo settings: ${logoSettings.id}`);
  console.log(`   🔍 SEO settings: ${seo.id}`);
  console.log(`   💰 Currencies: ${currencies.length}`);
  console.log(`   ⏱️ Session durations: ${sessionDurations.length}`);
  console.log(`   💵 Rates: ${rates.length}`);
  console.log(`   📦 Package definitions: ${packageDefinitions.length}`);
  console.log(`   💲 Package prices: ${packagePrices.length}`);
  console.log(`   📅 Schedule templates: ${scheduleTemplates.length}`);
  console.log(`   📅 Schedule slots: ${scheduleSlots.length}`);
  console.log(`   💳 Payment methods: ${paymentMethods.length}`);
  console.log(`   💳 Payment methods data: ${paymentMethodsData.length}`);
  console.log(`   👥 Group booking tiers: ${groupBookingTiers.length}`);
  console.log(`   📦 Legacy soul packages: handled by PackageDefinition and PackagePrice`);
  console.log(`   👥 Test clients: ${clients.length}`);
  console.log(`   📦 Test user packages: ${userPackages.length}`);
  console.log(`   📋 Test bookings: ${bookings.length}`);
  console.log(`   💳 Test payment records: ${paymentRecords.length}`);
  console.log(`   👤 Admin profiles: skipped (model doesn't exist)`);
  console.log(`   👤 Admin client profile: ${adminClient.id}`);
  console.log(`   👤 New admin user: ${newAdminUser.email}`);
  console.log(`   🖼️ Profile image: ${profileImage.id}`);
  console.log(`   🖼️ Test images: ${images.length}`);
  console.log(`   🐛 Test bug reports: ${bugReports.length}`);
  console.log(`   💬 Test bug comments: ${bugComments.length}`);
  console.log('');
  console.log('🚀 Your SOULPATH system is now fully seeded and ready for testing!');
  console.log('');
  console.log('🔑 Test Credentials:');
  console.log('   Admin: admin@soulpath.lat');
  console.log('   Admin: coco@soulpath.lat (password: soulpath2025!)');
  console.log('   Admin: beto@soulpath.lat (password: soulpath)');
  console.log('   Client 1: john.doe@example.com');
  console.log('   Client 2: maria.garcia@example.com');
  console.log('   Client 3: test@example.com');
  console.log('');
  console.log('💡 You can now test all features including:');
  console.log('   • Booking system');
  console.log('   • Payment processing');
  console.log('   • Package management');
  console.log('   • Schedule management');
  console.log('   • Bug reporting system');
  console.log('   • Email notifications');
  console.log('   • Multi-language support');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
