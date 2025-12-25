"""
Notification Service
Handles periodic notifications and alerts to Zalo OA users
"""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import logging

from ..models import ZaloUser, Notification, Report
from .zalo_service import ZaloService

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, zalo_service: ZaloService):
        self.zalo_service = zalo_service
        self.is_running = False
        
    async def start_scheduler(self, db: AsyncSession):
        """Start the notification scheduler"""
        self.is_running = True
        logger.info("Notification scheduler started")
        
        while self.is_running:
            try:
                # Send daily tips at 9 AM
                await self._send_daily_tips(db)
                
                # Send new report alerts
                await self._send_new_report_alerts(db)
                
                # Wait 1 hour before next check
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in notification scheduler: {e}")
                await asyncio.sleep(3600)
    
    def stop_scheduler(self):
        """Stop the notification scheduler"""
        self.is_running = False
        logger.info("Notification scheduler stopped")
    
    async def _send_daily_tips(self, db: AsyncSession):
        """Send daily fraud prevention tips to subscribed users"""
        now = datetime.now()
        
        # Check if it's 9 AM
        if now.hour != 9 or now.minute >= 30:
            return
            
        # Get tip of the day
        tip = self._get_tip_of_day(now.day % 10)
        
        # Get all active users who subscribed to tips
        result = await db.execute(
            select(ZaloUser).where(
                and_(
                    ZaloUser.is_active == True,
                    ZaloUser.receive_tips == True
                )
            )
        )
        users = result.scalars().all()
        
        # Send tips
        for user in users:
            try:
                await self.zalo_service.send_message(
                    user_id=user.zalo_user_id,
                    message=f"🛡️ Mẹo phòng chống lừa đảo:\n\n{tip}\n\n💡 Bạn có thể tắt thông báo này bằng cách gửi 'STOP'"
                )
                
                # Log notification
                notification = Notification(
                    user_id=user.id,
                    type="daily_tip",
                    title="Mẹo phòng chống lừa đảo",
                    message=tip,
                    sent_at=datetime.now()
                )
                db.add(notification)
                
                logger.info(f"Sent daily tip to user {user.zalo_user_id}")
                
            except Exception as e:
                logger.error(f"Failed to send tip to {user.zalo_user_id}: {e}")
        
        await db.commit()
    
    async def _send_new_report_alerts(self, db: AsyncSession):
        """Send alerts about new scam reports to subscribed users"""
        # Get reports from last hour
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        result = await db.execute(
            select(Report).where(
                and_(
                    Report.created_at >= one_hour_ago,
                    Report.status == "verified"
                )
            )
        )
        new_reports = result.scalars().all()
        
        if not new_reports:
            return
        
        # Get users subscribed to alerts
        result = await db.execute(
            select(ZaloUser).where(
                and_(
                    ZaloUser.is_active == True,
                    ZaloUser.receive_alerts == True
                )
            )
        )
        users = result.scalars().all()
        
        # Format alert message
        alert_msg = f"⚠️ Cảnh báo lừa đảo mới!\n\n"
        alert_msg += f"📊 Có {len(new_reports)} trường hợp lừa đảo mới được xác minh:\n\n"
        
        for report in new_reports[:3]:  # Top 3 reports
            alert_msg += f"• {report.scam_type}: {report.phone_number or report.bank_account}\n"
            if report.amount:
                alert_msg += f"  Số tiền: {report.amount:,.0f} VNĐ\n"
        
        if len(new_reports) > 3:
            alert_msg += f"\n... và {len(new_reports) - 3} trường hợp khác."
        
        alert_msg += "\n\n⚠️ Hãy cảnh giác và kiểm tra kỹ trước khi giao dịch!"
        
        # Send alerts
        for user in users:
            try:
                await self.zalo_service.send_message(
                    user_id=user.zalo_user_id,
                    message=alert_msg
                )
                
                # Log notification
                notification = Notification(
                    user_id=user.id,
                    type="new_report_alert",
                    title="Cảnh báo lừa đảo mới",
                    message=alert_msg,
                    sent_at=datetime.now()
                )
                db.add(notification)
                
                logger.info(f"Sent report alert to user {user.zalo_user_id}")
                
            except Exception as e:
                logger.error(f"Failed to send alert to {user.zalo_user_id}: {e}")
        
        await db.commit()
    
    async def send_custom_notification(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "custom"
    ):
        """Send a custom notification to a specific user"""
        try:
            # Get user
            result = await db.execute(
                select(ZaloUser).where(ZaloUser.zalo_user_id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
                logger.warning(f"User {user_id} not found or inactive")
                return False
            
            # Send message
            await self.zalo_service.send_message(
                user_id=user_id,
                message=f"{title}\n\n{message}"
            )
            
            # Log notification
            notification = Notification(
                user_id=user.id,
                type=notification_type,
                title=title,
                message=message,
                sent_at=datetime.now()
            )
            db.add(notification)
            await db.commit()
            
            logger.info(f"Sent custom notification to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send custom notification: {e}")
            return False
    
    async def broadcast_message(
        self,
        db: AsyncSession,
        title: str,
        message: str,
        user_filter: Optional[dict] = None
    ):
        """Broadcast a message to all or filtered users"""
        # Build query
        query = select(ZaloUser).where(ZaloUser.is_active == True)
        
        if user_filter:
            if user_filter.get("receive_alerts"):
                query = query.where(ZaloUser.receive_alerts == True)
            if user_filter.get("receive_tips"):
                query = query.where(ZaloUser.receive_tips == True)
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        logger.info(f"Broadcasting to {len(users)} users")
        
        success_count = 0
        for user in users:
            try:
                await self.zalo_service.send_message(
                    user_id=user.zalo_user_id,
                    message=f"{title}\n\n{message}"
                )
                
                # Log notification
                notification = Notification(
                    user_id=user.id,
                    type="broadcast",
                    title=title,
                    message=message,
                    sent_at=datetime.now()
                )
                db.add(notification)
                
                success_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send to {user.zalo_user_id}: {e}")
        
        await db.commit()
        logger.info(f"Broadcast completed: {success_count}/{len(users)} successful")
        
        return success_count
    
    def _get_tip_of_day(self, day: int) -> str:
        """Get fraud prevention tip based on day"""
        tips = [
            "Không bao giờ chia sẻ mã OTP với bất kỳ ai, kể cả nhân viên ngân hàng.",
            "Kiểm tra kỹ số điện thoại và tên người gửi trước khi chuyển tiền.",
            "Cảnh giác với các tin nhắn yêu cầu cập nhật thông tin tài khoản ngân hàng.",
            "Không click vào link lạ trong tin nhắn SMS hoặc email.",
            "Xác minh nguồn gốc của người gọi trước khi cung cấp thông tin cá nhân.",
            "Tuyệt đối không chuyển tiền cho người lạ qua mạng xã hội.",
            "Kiểm tra thông tin người bán trên các nền tảng thương mại điện tử.",
            "Cảnh giác với các chương trình đầu tư hứa hẹn lợi nhuận cao bất thường.",
            "Không tải ứng dụng từ nguồn không rõ ràng.",
            "Báo cáo ngay cho cơ quan chức năng khi phát hiện dấu hiệu lừa đảo."
        ]
        return tips[day % len(tips)]


# Singleton instance
notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get notification service singleton"""
    global notification_service
    if notification_service is None:
        from .zalo_service import get_zalo_service
        notification_service = NotificationService(get_zalo_service())
    return notification_service
