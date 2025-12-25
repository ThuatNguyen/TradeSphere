"""
Notification API Endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ....database import get_db
from ....services.notification_service import get_notification_service


router = APIRouter()


class CustomNotificationRequest(BaseModel):
    user_id: str
    title: str
    message: str
    type: Optional[str] = "custom"


class BroadcastRequest(BaseModel):
    title: str
    message: str
    receive_alerts: Optional[bool] = None
    receive_tips: Optional[bool] = None


@router.post("/send")
async def send_notification(
    request: CustomNotificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Send a custom notification to a specific user"""
    notification_service = get_notification_service()
    
    success = await notification_service.send_custom_notification(
        db=db,
        user_id=request.user_id,
        title=request.title,
        message=request.message,
        notification_type=request.type
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to send notification")
    
    return {"success": True, "message": "Notification sent"}


@router.post("/broadcast")
async def broadcast_notification(
    request: BroadcastRequest,
    db: AsyncSession = Depends(get_db)
):
    """Broadcast a message to all or filtered users"""
    notification_service = get_notification_service()
    
    user_filter = {}
    if request.receive_alerts is not None:
        user_filter["receive_alerts"] = request.receive_alerts
    if request.receive_tips is not None:
        user_filter["receive_tips"] = request.receive_tips
    
    success_count = await notification_service.broadcast_message(
        db=db,
        title=request.title,
        message=request.message,
        user_filter=user_filter if user_filter else None
    )
    
    return {
        "success": True,
        "message": f"Broadcast sent to {success_count} users",
        "count": success_count
    }
