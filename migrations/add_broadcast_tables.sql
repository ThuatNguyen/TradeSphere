-- Migration: Add broadcast campaign tables
-- Created: 2025-12-28

-- Create broadcast_campaigns table
CREATE TABLE IF NOT EXISTS broadcast_campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    target VARCHAR(50) DEFAULT 'all',
    target_user_ids JSONB,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_users INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index on status and created_at
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_status ON broadcast_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_created_at ON broadcast_campaigns(created_at DESC);

-- Create broadcast_logs table
CREATE TABLE IF NOT EXISTS broadcast_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL,
    zalo_user_id VARCHAR(100) NOT NULL,
    status VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on broadcast_logs
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_campaign_id ON broadcast_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_zalo_user_id ON broadcast_logs(zalo_user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_status ON broadcast_logs(status);

-- Add comments
COMMENT ON TABLE broadcast_campaigns IS 'Broadcast campaigns for Zalo OA messaging';
COMMENT ON TABLE broadcast_logs IS 'Detailed logs for each broadcast message sent';

-- Sample data (optional, for testing)
-- INSERT INTO broadcast_campaigns (title, content, status, target, created_by)
-- VALUES (
--     'Test Broadcast',
--     '🚨 CẢNH BÁO LỪA ĐẢO\n\nĐây là tin nhắn test từ hệ thống.',
--     'draft',
--     'all',
--     'admin'
-- );
