const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const externalApis = [
  {
    name: 'openai',
    provider: 'OpenAI',
    category: 'ai',
    apiKey: 'YOUR_OPENAI_API_KEY', // Replace with real API key
    apiUrl: 'https://api.openai.com/v1',
    webhookUrl: null,
    webhookSecret: null,
    config: {
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7
    },
    isActive: true,
    rateLimit: 1000,
    rateLimitWindow: 3600
  },
  {
    name: 'openrouter',
    provider: 'OpenRouter',
    category: 'ai',
    apiKey: 'YOUR_OPENROUTER_API_KEY', // Replace with real API key
    apiUrl: 'https://openrouter.ai/api/v1',
    webhookUrl: null,
    webhookSecret: null,
    config: {
      model: 'meta-llama/llama-2-70b-chat',
      max_tokens: 1000,
      temperature: 0.7
    },
    isActive: true,
    rateLimit: 1000,
    rateLimitWindow: 3600
  },
  {
    name: 'stripe',
    provider: 'Stripe',
    category: 'payment',
    apiKey: 'YOUR_STRIPE_SECRET_KEY', // Replace with real API key
    apiUrl: 'https://api.stripe.com/v1',
    webhookUrl: 'https://your-domain.vercel.app/api/stripe/webhook',
    webhookSecret: 'YOUR_STRIPE_WEBHOOK_SECRET',
    config: {
      currency: 'usd',
      payment_methods: ['card', 'paypal'],
      webhook_events: ['payment_intent.succeeded', 'payment_intent.payment_failed']
    },
    isActive: true,
    rateLimit: 100,
    rateLimitWindow: 60
  },
  {
    name: 'twilio',
    provider: 'Twilio',
    category: 'communication',
    apiKey: 'YOUR_TWILIO_ACCOUNT_SID', // Replace with real API key
    apiUrl: 'https://api.twilio.com/2010-04-01',
    webhookUrl: null,
    webhookSecret: 'YOUR_TWILIO_AUTH_TOKEN',
    config: {
      phone_number: '+1234567890',
      messaging_service_sid: 'YOUR_MESSAGING_SERVICE_SID'
    },
    isActive: true,
    rateLimit: 1000,
    rateLimitWindow: 3600
  },
  {
    name: 'sendgrid',
    provider: 'SendGrid',
    category: 'email',
    apiKey: 'YOUR_SENDGRID_API_KEY', // Replace with real API key
    apiUrl: 'https://api.sendgrid.com/v3',
    webhookUrl: 'https://your-domain.vercel.app/api/sendgrid/webhook',
    webhookSecret: 'YOUR_SENDGRID_WEBHOOK_SECRET',
    config: {
      from_email: 'noreply@yourdomain.com',
      from_name: 'SoulPath',
      template_id: 'YOUR_TEMPLATE_ID'
    },
    isActive: true,
    rateLimit: 100,
    rateLimitWindow: 60
  }
];

async function seedExternalApis() {
  try {
    console.log('Seeding external APIs...');
    
    for (const api of externalApis) {
      const existingApi = await prisma.externalApi.findUnique({
        where: { name: api.name }
      });
      
      if (!existingApi) {
        await prisma.externalApi.create({
          data: api
        });
        console.log(`Created external API: ${api.name}`);
      } else {
        console.log(`External API already exists: ${api.name}`);
      }
    }
    
    console.log('External APIs seeded successfully!');
  } catch (error) {
    console.error('Error seeding external APIs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExternalApis();
