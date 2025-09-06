import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔐 Creating test admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create or update the admin user
    const user = await prisma.user.upsert({
      where: { email: 'admin@soulpath.lat' },
      update: {
        password: hashedPassword,
        role: 'admin'
      },
      create: {
        email: 'admin@soulpath.lat',
        password: hashedPassword,
        fullName: 'Admin User',
        role: 'admin'
      }
    });
    
    console.log('✅ Test user created/updated:', user.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', user.role);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
