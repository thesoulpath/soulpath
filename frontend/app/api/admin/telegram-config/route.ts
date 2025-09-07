import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { TelegramService } from '@/lib/services/telegram-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/telegram-config - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (user.role !== 'admin') {
      console.log('❌ Admin access required');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('✅ User authenticated:', user.email);

    const supabase = createAdminClient();
    console.log('🔍 Fetching from telegram_config table...');
    
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('telegram_config')
      .select('*')
      .single();

    if (error) {
      console.log('⚠️ telegram_config table might not exist, using default config:', error.message);
      
      // Return default Telegram configuration if table doesn't exist
      const defaultConfig = {
        bot_token: '',
        webhook_url: '',
        is_active: false,
        bot_username: '',
        bot_name: '',
        webhook_set: false,
        last_webhook_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('✅ Returning default Telegram config');
      return NextResponse.json({ config: defaultConfig });
    }

    console.log('✅ Telegram config fetched successfully:', data);
    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/telegram-config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/admin/telegram-config - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (user.role !== 'admin') {
      console.log('❌ Admin access required');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { bot_token, webhook_url, is_active } = body;

    console.log('📝 Updating Telegram configuration...');

    const supabase = createAdminClient();

    // Validate bot token if provided
    let botInfo = null;
    let webhookSet = false;
    let lastWebhookError = null;

    if (bot_token) {
      try {
        const telegramService = new TelegramService(bot_token);
        const testResult = await telegramService.testConnection();
        
        if (testResult.success && testResult.botInfo) {
          botInfo = testResult.botInfo;
          console.log('✅ Bot token validated successfully');
        } else {
          console.log('❌ Bot token validation failed:', testResult.message);
          return NextResponse.json({ 
            error: 'Invalid bot token', 
            details: testResult.message 
          }, { status: 400 });
        }
      } catch (error) {
        console.log('❌ Error validating bot token:', error);
        return NextResponse.json({ 
          error: 'Failed to validate bot token', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 400 });
      }
    }

    // Set webhook if both bot_token and webhook_url are provided
    if (bot_token && webhook_url) {
      try {
        const telegramService = new TelegramService(bot_token);
        const webhookResult = await telegramService.setWebhook(webhook_url);
        
        if (webhookResult) {
          webhookSet = true;
          console.log('✅ Webhook set successfully');
        } else {
          lastWebhookError = 'Failed to set webhook';
          console.log('❌ Failed to set webhook');
        }
      } catch (error) {
        lastWebhookError = error instanceof Error ? error.message : 'Unknown error';
        console.log('❌ Error setting webhook:', error);
      }
    }

    // Prepare data for database
    const configData = {
      bot_token: bot_token || '',
      webhook_url: webhook_url || '',
      is_active: is_active || false,
      bot_username: botInfo?.username || '',
      bot_name: botInfo?.first_name || '',
      webhook_set: webhookSet,
      last_webhook_error: lastWebhookError,
      updated_at: new Date().toISOString()
    };

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('telegram_config')
      .select('id')
      .single();

    let result;
    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('telegram_config')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating Telegram config:', error);
        return NextResponse.json({ 
          error: 'Failed to update configuration', 
          details: error.message 
        }, { status: 500 });
      }

      result = data;
      console.log('✅ Telegram config updated successfully');
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('telegram_config')
        .insert([{
          ...configData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating Telegram config:', error);
        return NextResponse.json({ 
          error: 'Failed to create configuration', 
          details: error.message 
        }, { status: 500 });
      }

      result = data;
      console.log('✅ Telegram config created successfully');
    }

    return NextResponse.json({ 
      success: true, 
      config: result,
      message: 'Telegram configuration saved successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/admin/telegram-config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/admin/telegram-config - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (user.role !== 'admin') {
      console.log('❌ Admin access required');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get current config to delete webhook
    const { data: currentConfig } = await supabase
      .from('telegram_config')
      .select('bot_token')
      .single();

    // Delete webhook if bot token exists
    if (currentConfig?.bot_token) {
      try {
        const telegramService = new TelegramService(currentConfig.bot_token);
        await telegramService.deleteWebhook();
        console.log('✅ Webhook deleted successfully');
      } catch (error) {
        console.log('⚠️ Error deleting webhook:', error);
      }
    }

    // Delete config from database
    const { error } = await supabase
      .from('telegram_config')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.error('❌ Error deleting Telegram config:', error);
      return NextResponse.json({ 
        error: 'Failed to delete configuration', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Telegram config deleted successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Telegram configuration deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/admin/telegram-config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}
