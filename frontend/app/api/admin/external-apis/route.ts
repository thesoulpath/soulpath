import { NextRequest, NextResponse } from 'next/server';
import { ExternalAPIService } from '@/lib/services/external-api-service';
import { requireAuth } from '@/lib/auth';

// Inicializar servicio
const apiService = new ExternalAPIService();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list':
        const configs = await apiService.getAllConfigs();
        return NextResponse.json({
          success: true,
          data: configs,
        });

      case 'audit':
        const configId = searchParams.get('configId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const auditLogs = await apiService.getAuditLogs(configId || undefined, limit, offset);
        return NextResponse.json({
          success: true,
          data: auditLogs,
        });

      default:
        // Listar todas las configuraciones por defecto
        const allConfigs = await apiService.getAllConfigs();
        return NextResponse.json({
          success: true,
          data: allConfigs,
        });
    }

  } catch (error) {
    console.error('External APIs GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    // Obtener IP y User-Agent para auditoría
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    switch (action) {
      case 'create':
        if (!data || !data.name || !data.provider || !data.category) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: name, provider, category' },
            { status: 400 }
          );
        }

        const newConfig = await apiService.createConfig(
          data,
          user.id,
          ipAddress,
          userAgent
        );

        return NextResponse.json({
          success: true,
          data: newConfig,
          message: 'API configuration created successfully',
        });

      case 'test':
        if (!data?.id) {
          return NextResponse.json(
            { success: false, error: 'Configuration ID is required' },
            { status: 400 }
          );
        }

        const testResult = await apiService.testConfig(
          data.id,
          user.id,
          ipAddress,
          userAgent
        );

        return NextResponse.json({
          success: true,
          data: testResult,
          message: testResult.success ? 'API test successful' : 'API test failed',
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('External APIs POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = body;

    // Obtener IP y User-Agent para auditoría
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    const updatedConfig = await apiService.updateConfig(
      id,
      updateData,
      user.id,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'API configuration updated successfully',
    });

  } catch (error) {
    console.error('External APIs PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Obtener IP y User-Agent para auditoría
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    await apiService.deleteConfig(
      id,
      user.id,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: 'API configuration deleted successfully',
    });

  } catch (error) {
    console.error('External APIs DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

