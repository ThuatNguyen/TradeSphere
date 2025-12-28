"""SQLAlchemy models matching Drizzle schema"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, 
    DateTime, ARRAY, ForeignKey, JSON
)
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    accused_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False, index=True)
    account_number = Column(String)
    bank = Column(String)
    amount = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    reporter_name = Column(String)
    reporter_phone = Column(String)
    receipt_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BlogPost(Base):
    __tablename__ = "blog_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    excerpt = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    cover_image = Column(String)
    tags = Column(ARRAY(String))
    read_time = Column(Integer, default=5)
    views = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, nullable=False, index=True)
    user_agent = Column(Text)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_user = Column(Boolean, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# New models for integration
class ScamSearch(Base):
    __tablename__ = "scam_searches"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False, index=True)
    source = Column(String(50))  # 'web' or 'zalo'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    zalo_user_id = Column(String(100))
    results_count = Column(Integer)
    search_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    response_time_ms = Column(Integer)


class ScamCache(Base):
    __tablename__ = "scam_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False, index=True)
    source = Column(String(50), nullable=False)  # 'admin', 'checkscam', 'chongluadao'
    data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    hit_count = Column(Integer, default=0)



class ZaloUser(Base):
    __tablename__ = "zalo_users"
    
    id = Column(Integer, primary_key=True, index=True)
    zalo_user_id = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(255))
    avatar = Column(String(500))
    followed_at = Column(DateTime(timezone=True), server_default=func.now())
    last_interaction = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    preferences = Column(JSON)


class ZaloMessage(Base):
    __tablename__ = "zalo_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    zalo_user_id = Column(String(100), nullable=False, index=True)
    message_type = Column(String(50))  # 'text', 'image', 'sticker'
    message_content = Column(Text)
    is_from_user = Column(Boolean)
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50))  # 'new_report', 'warning', 'tip'
    title = Column(String(255))
    content = Column(Text)
    target_channel = Column(String(50))  # 'web', 'zalo', 'all'
    status = Column(String(50), default='pending')  # 'pending', 'sent', 'failed'
    scheduled_at = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BroadcastCampaign(Base):
    __tablename__ = "broadcast_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(50), default='draft', index=True)  # 'draft', 'scheduled', 'sending', 'completed', 'failed'
    target = Column(String(50), default='all')  # 'all', 'active', 'specific'
    target_user_ids = Column(JSON)  # List of specific user IDs if target='specific'
    scheduled_time = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    total_users = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_by = Column(String(100))  # Admin user
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=False, index=True)
    zalo_user_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50))  # 'success', 'failed'
    error_message = Column(Text)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())


class ApiLog(Base):
    __tablename__ = "api_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(50))  # 'express', 'fastapi', 'zalo'
    endpoint = Column(String(255))
    method = Column(String(10))
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    user_agent = Column(Text)
    ip_address = Column(String(45))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
