import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTemplates() {
  try {
    console.log('🔍 Testing communication templates...');

    // Check communication config
    const config = await prisma.communicationConfig.findFirst();
    console.log('📧 Communication config:', config);

    // Check email templates
    const emailTemplates = await prisma.communicationTemplate.findMany({
      where: { type: 'email' },
      include: { translations: true }
    });
    console.log('📝 Email templates:', emailTemplates.length);
    emailTemplates.forEach(template => {
      console.log(`  - ${template.name} (${template.templateKey}): ${template.translations.length} translations`);
    });

    // Check SMS templates
    const smsTemplates = await prisma.communicationTemplate.findMany({
      where: { type: 'sms' },
      include: { translations: true }
    });
    console.log('📱 SMS templates:', smsTemplates.length);
    smsTemplates.forEach(template => {
      console.log(`  - ${template.name} (${template.templateKey}): ${template.translations.length} translations`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplates();
