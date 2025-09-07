/**
 * Telegram Bot API Service
 * Handles all Telegram bot operations including webhook setup, message sending, and bot management
 */

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    type: string;
  };
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramMessage['from'];
    message?: TelegramMessage;
    data?: string;
  };
}

export interface TelegramInlineKeyboard {
  text: string;
  callback_data: string;
}

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineKeyboard[][];
}

export class TelegramService {
  private baseUrl: string;

  constructor(botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<TelegramBotInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json();

      if (data.ok) {
        return data.result;
      } else {
        console.error('Failed to get bot info:', data.description);
        return null;
      }
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }

  /**
   * Set webhook for the bot
   */
  async setWebhook(webhookUrl: string, allowedUpdates: string[] = ['message', 'callback_query']): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: allowedUpdates,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('Webhook set successfully');
        return true;
      } else {
        console.error('Failed to set webhook:', data.description);
        return false;
      }
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  /**
   * Get webhook information
   */
  async getWebhookInfo(): Promise<TelegramWebhookInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/getWebhookInfo`);
      const data = await response.json();

      if (data.ok) {
        return data.result;
      } else {
        console.error('Failed to get webhook info:', data.description);
        return null;
      }
    } catch (error) {
      console.error('Error getting webhook info:', error);
      return null;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/deleteWebhook`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.ok) {
        console.log('Webhook deleted successfully');
        return true;
      } else {
        console.error('Failed to delete webhook:', data.description);
        return false;
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }

  /**
   * Send text message
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    options: {
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      replyMarkup?: TelegramReplyMarkup;
      disableWebPagePreview?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: options.parseMode || 'HTML',
          reply_markup: options.replyMarkup,
          disable_web_page_preview: options.disableWebPagePreview,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('Message sent successfully');
        return true;
      } else {
        console.error('Failed to send message:', data.description);
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Send photo
   */
  async sendPhoto(
    chatId: string | number,
    photo: string,
    caption?: string,
    options: {
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      replyMarkup?: TelegramReplyMarkup;
    } = {}
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photo,
          caption: caption,
          parse_mode: options.parseMode || 'HTML',
          reply_markup: options.replyMarkup,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('Photo sent successfully');
        return true;
      } else {
        console.error('Failed to send photo:', data.description);
        return false;
      }
    } catch (error) {
      console.error('Error sending photo:', error);
      return false;
    }
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert: boolean = false
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: showAlert,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('Callback query answered successfully');
        return true;
      } else {
        console.error('Failed to answer callback query:', data.description);
        return false;
      }
    } catch (error) {
      console.error('Error answering callback query:', error);
      return false;
    }
  }

  /**
   * Create inline keyboard
   */
  createInlineKeyboard(buttons: { text: string; callbackData: string }[][]): TelegramReplyMarkup {
    return {
      inline_keyboard: buttons.map(row =>
        row.map(button => ({
          text: button.text,
          callback_data: button.callbackData,
        }))
      ),
    };
  }

  /**
   * Test bot connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; botInfo?: TelegramBotInfo }> {
    try {
      const botInfo = await this.getBotInfo();
      
      if (botInfo) {
        return {
          success: true,
          message: `Bot connected successfully! Bot name: ${botInfo.first_name} (@${botInfo.username || 'no_username'})`,
          botInfo,
        };
      } else {
        return {
          success: false,
          message: 'Failed to connect to Telegram bot. Please check your bot token.',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get updates (for polling mode)
   */
  async getUpdates(offset?: number, limit: number = 100): Promise<TelegramUpdate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/getUpdates?offset=${offset || ''}&limit=${limit}`);
      const data = await response.json();

      if (data.ok) {
        return data.result;
      } else {
        console.error('Failed to get updates:', data.description);
        return [];
      }
    } catch (error) {
      console.error('Error getting updates:', error);
      return [];
    }
  }
}

// Factory function to create Telegram service instance
export function createTelegramService(botToken: string): TelegramService {
  return new TelegramService(botToken);
}
