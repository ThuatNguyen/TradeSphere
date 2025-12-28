"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# Scam Search Schemas
class ScamSearchRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=255)
    type: Optional[str] = Field(None, description="admin, checkscam, chongluadao, or all")


class ScamSearchResponse(BaseModel):
    success: bool
    keyword: str
    total_results: int
    sources: List[Dict[str, Any]]
    cached: bool = False
    response_time_ms: Optional[int] = None


class ScamDetailResponse(BaseModel):
    name: Optional[str]
    phone: Optional[str]
    account_number: Optional[str]
    bank: Optional[str]
    amount: Optional[str]
    views: Optional[str]
    date: Optional[str]
    detail_link: Optional[str]


# AI Schemas
class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    context: Optional[List[Dict[str, str]]] = None


class AIChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: datetime


class AIAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class AIAnalyzeResponse(BaseModel):
    is_scam: bool
    confidence: float = Field(..., ge=0, le=100)
    indicators: List[str]
    explanation: str


# Zalo Schemas
class ZaloWebhookEvent(BaseModel):
    event_name: str
    sender: Dict[str, Any]
    recipient: Dict[str, Any]
    timestamp: str
    message: Optional[Dict[str, Any]] = None


class ZaloSendMessageRequest(BaseModel):
    user_id: str
    message: str


class ZaloSendMessageResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None


# Broadcast Schemas
class BroadcastCampaignCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=2000)
    target: str = Field(default="all", pattern="^(all|active|specific)$")
    target_user_ids: Optional[List[str]] = None
    scheduled_time: Optional[datetime] = None


class BroadcastCampaignResponse(BaseModel):
    id: int
    title: str
    content: str
    status: str
    target: str
    total_users: int
    sent_count: int
    success_count: int
    failed_count: int
    scheduled_time: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class BroadcastStatsResponse(BaseModel):
    campaign_id: int
    status: str
    total_users: int
    sent_count: int
    success_count: int
    failed_count: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    success_rate: float
    failed_users: List[Dict[str, str]] = []


class BroadcastSendRequest(BaseModel):
    send_now: bool = True
    scheduled_time: Optional[datetime] = None


# Cache Schemas
class CacheStatsResponse(BaseModel):
    total_cached: int
    hit_rate: float
    total_hits: int
    cache_size_mb: float


# Health Check
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    database: str
    redis: str
    timestamp: datetime


# API Response wrapper
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
