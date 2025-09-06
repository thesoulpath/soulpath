import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

interface CommunicationTemplateWhereClause {
  type?: string;
  category?: string;
  isActive?: boolean;
}

// Zod schemas for template validation
const templateTranslationSchema = z.object({
  language: z.string().min(2, 'Language code is required'),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required')
});

const createTemplateSchema = z.object({
  templateKey: z.string().min(1, 'Template key is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  type: z.enum(['email', 'sms']),
  category: z.string().optional(),
  translations: z.array(templateTranslationSchema).min(1, 'At least one translation is required')
});



const querySchema = z.object({
  type: z.enum(['email', 'sms']).optional(),
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { type, category, isActive, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    // Build the query
    const where: CommunicationTemplateWhereClause = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.communicationTemplate.findMany({
      where,
      include: {
        translations: {
          orderBy: { language: 'asc' }
        }
      },
      skip: offset,
      take: limit,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    const totalCount = await prisma.communicationTemplate.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      templates,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching communication templates:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch templates'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid template data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const templateData = validation.data;

    // Check if template key already exists
    const existingTemplate = await prisma.communicationTemplate.findFirst({
      where: { templateKey: templateData.templateKey }
    });

    if (existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template key already exists',
        message: 'A template with this key already exists'
      }, { status: 400 });
    }

    // Create template with translations
    const template = await prisma.communicationTemplate.create({
      data: {
        templateKey: templateData.templateKey,
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        category: templateData.category,
        isActive: true,
        isDefault: false,
        translations: {
          create: templateData.translations.map(translation => ({
            language: translation.language,
            subject: translation.subject,
            content: translation.content
          }))
        }
      },
      include: {
        translations: true
      }
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Error creating communication template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create template'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}