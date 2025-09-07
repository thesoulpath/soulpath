-- Create telegram_config table for storing Telegram bot configuration
-- This table stores the bot token, webhook settings, and status information

CREATE TABLE IF NOT EXISTS telegram_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_token TEXT NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    bot_username TEXT,
    bot_name TEXT,
    webhook_set BOOLEAN DEFAULT FALSE,
    last_webhook_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_config_active ON telegram_config(is_active);
CREATE INDEX IF NOT EXISTS idx_telegram_config_updated ON telegram_config(updated_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_telegram_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_telegram_config_updated_at
    BEFORE UPDATE ON telegram_config
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_config_updated_at();

-- Insert default configuration (will be updated via admin interface)
INSERT INTO telegram_config (
    bot_token,
    webhook_url,
    is_active,
    bot_username,
    bot_name,
    webhook_set
) VALUES (
    '8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig',
    '',
    FALSE,
    '',
    '',
    FALSE
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE telegram_config IS 'Stores Telegram bot configuration and webhook settings';
COMMENT ON COLUMN telegram_config.bot_token IS 'Telegram bot token from BotFather';
COMMENT ON COLUMN telegram_config.webhook_url IS 'Webhook URL for receiving Telegram updates';
COMMENT ON COLUMN telegram_config.is_active IS 'Whether the bot is currently active';
COMMENT ON COLUMN telegram_config.bot_username IS 'Bot username (e.g., @mybot)';
COMMENT ON COLUMN telegram_config.bot_name IS 'Bot display name';
COMMENT ON COLUMN telegram_config.webhook_set IS 'Whether webhook is successfully configured';
COMMENT ON COLUMN telegram_config.last_webhook_error IS 'Last webhook error message if any';
