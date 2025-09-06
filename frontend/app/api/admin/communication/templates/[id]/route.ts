import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schemas for template validation
const templateTranslationSchema = z.object({
  language: z.string().min(2, 'Language code is required'),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required')
});

const updateTemplateSchema = z.object({
  templateKey: z.string().min(1, 'Template key is required').optional(),
  name: z.string().min(1, 'Template name is required').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  translations: z.array(templateTranslationSchema).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid template ID',
        message: 'Template ID must be a number'
      }, { status: 400 });
    }

    const template = await prisma.communicationTemplate.findUnique({
      where: { id },
      include: {
        translations: {
          orderBy: { language: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
        message: 'Template with this ID does not exist'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Error fetching communication template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch template'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid template ID',
        message: 'Template ID must be a number'
      }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid template data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const updateData = validation.data;

    // Check if template exists
    const existingTemplate = await prisma.communicationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
        message: 'Template with this ID does not exist'
      }, { status: 404 });
    }

    // Check if template key already exists (if being updated)
    if (updateData.templateKey && updateData.templateKey !== existingTemplate.templateKey) {
      const keyExists = await prisma.communicationTemplate.findFirst({
        where: { 
          templateKey: updateData.templateKey,
          id: { not: id }
        }
      });

      if (keyExists) {
        return NextResponse.json({
          success: false,
          error: 'Template key already exists',
          message: 'A template with this key already exists'
        }, { status: 400 });
      }
    }

    // If setting as default, unset other defaults of the same type
    if (updateData.isDefault) {
      await prisma.communicationTemplate.updateMany({
        where: {
          type: existingTemplate.type,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    // Update template
    const template = await prisma.communicationTemplate.update({
      where: { id },
      data: {
        templateKey: updateData.templateKey,
        name: updateData.name,
        description: updateData.description,
        category: updateData.category,
        isActive: updateData.isActive,
        isDefault: updateData.isDefault
      },
      include: {
        translations: {
          orderBy: { language: 'asc' }
        }
      }
    });

    // Update translations if provided
    if (updateData.translations) {
      // Delete existing translations
      await prisma.communicationTemplateTranslation.deleteMany({
        where: { templateId: id }
      });

      // Create new translations
      await prisma.communicationTemplateTranslation.createMany({
        data: updateData.translations.map(translation => ({
          templateId: id,
          language: translation.language,
          subject: translation.subject,
          content: translation.content
        }))
      });

      // Fetch updated template with translations
      const updatedTemplate = await prisma.communicationTemplate.findUnique({
        where: { id },
        include: {
          translations: {
            orderBy: { language: 'asc' }
          }
        }
      });

      return NextResponse.json({
        success: true,
        template: updatedTemplate,
        message: 'Template updated successfully'
      });
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Error updating communication template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update template'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid template ID',
        message: 'Template ID must be a number'
      }, { status: 400 });
    }

    // Check if template exists and is not default
    const existingTemplate = await prisma.communicationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
        message: 'Template with this ID does not exist'
      }, { status: 404 });
    }

    if (existingTemplate.isDefault) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete default template',
        message: 'Default templates cannot be deleted'
      }, { status: 400 });
    }

    // Delete template (translations will be deleted automatically due to cascade)
    await prisma.communicationTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting communication template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete template'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}