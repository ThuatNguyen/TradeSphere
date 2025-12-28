"""Zalo OA webhook and messaging endpoints"""
from fastapi import APIRouter, HTTPException, Request, Header, Depends
from typing import Optional
import re
from ....schemas import ZaloWebhookEvent, ZaloSendMessageRequest, ZaloSendMessageResponse
from ....services import zalo_service, crawler_service, ai_service
from ....database import get_db
from ....models import ZaloUser, ZaloMessage
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter()


def is_phone_number(text: str) -> bool:
    """Check if text is a phone number"""
    # Vietnamese phone number patterns
    pattern = r'^(0|\+84)[0-9]{9,10}$'
    clean_text = re.sub(r'[\s\-\.]', '', text.strip())
    return bool(re.match(pattern, clean_text))


def is_bank_account(text: str) -> bool:
    """Check if text is a bank account number"""
    # Bank account: 6-16 digits
    pattern = r'^[0-9]{6,16}$'
    clean_text = text.strip()
    return bool(re.match(pattern, clean_text))


async def format_scam_results_for_zalo(results: dict) -> str:
    """Format scam search results for Zalo message"""
    if results.get("total_results", 0) == 0:
        return f"""✅ KHÔNG TÌM THẤY CẢNH BÁO

Số/tài khoản "{results['keyword']}" chưa có báo cáo lừa đảo trong hệ thống.

⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
Luôn cẩn thận khi giao dịch tiền bạc!

💡 Gửi tin nhắn để tôi tư vấn thêm."""
    
    message = f"""🚨 PHÁT HIỆN CẢNH BÁO

Từ khóa: {results['keyword']}
Tổng số báo cáo: {results['total_results']}

"""
    
    for source in results.get("sources", []):
        if source.get("success") and source.get("data"):
            total = source.get("total_scams", 0)
            if isinstance(total, str) and total.isdigit():
                total = int(total)
            
            if total > 0:
                source_name = source.get("source", "").upper()
                message += f"📌 {source_name}: {total} báo cáo\n"
                
                # Show top 2 results
                for item in source["data"][:2]:
                    name = item.get("name", "N/A")
                    date = item.get("date", "N/A")
                    message += f"  • {name}\n"
                    if date and date != "N/A":
                        message += f"    {date}\n"
    
    message += f"\n⚠️ Cảnh báo: Có thể là lừa đảo!"
    message += f"\n💻 Chi tiết: https://tradesphere.com/search?q={results['keyword']}"
    
    return message


@router.post("/webhook")
async def zalo_webhook(
    request: Request,
    x_zalo_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for Zalo OA events
    
    Handles:
    - user_send_text: Text messages from users
    - user_send_image: Image messages
    - follow: User follows OA
    - unfollow: User unfollows OA
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        
        # Verify signature (in production)
        # if not zalo_service.verify_signature(body, x_zalo_signature):
        #     raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse event
        data = await request.json()
        event_name = data.get("event_name")
        
        if event_name == "user_send_text":
            await handle_text_message(data, db)
        elif event_name == "user_send_image":
            await handle_image_message(data, db)
        elif event_name == "follow":
            await handle_follow(data, db)
        elif event_name == "unfollow":
            await handle_unfollow(data, db)
        
        return {"status": "ok"}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


async def handle_text_message(data: dict, db: Session):
    """Handle text message from user"""
    try:
        sender = data.get("sender", {})
        user_id = sender.get("id")
        message_data = data.get("message", {})
        message_text = message_data.get("text", "").strip()
        
        if not user_id or not message_text:
            return
        
        # Save incoming message
        incoming_msg = ZaloMessage(
            zalo_user_id=user_id,
            message_type="text",
            message_content=message_text,
            is_from_user=True
        )
        db.add(incoming_msg)
        db.commit()
        
        # Process message
        response_text = ""
        
        if message_text.lower() in ["/help", "help", "hướng dẫn"]:
            response_text = """🤖 HƯỚNG DẪN SỬ DỤNG

Gửi cho tôi:
📱 Số điện thoại - Kiểm tra SĐT lừa đảo
💳 Số tài khoản - Kiểm tra STK ngân hàng
💬 Tin nhắn/Email - Phân tích nội dung
❓ Câu hỏi - Tư vấn phòng chống lừa đảo

Ví dụ:
- 0123456789
- 1234567890
- "Bạn đã trúng thưởng 100 triệu..."

Gõ /help để xem hướng dẫn này."""
            
        elif is_phone_number(message_text):
            # Search phone number
            clean_phone = re.sub(r'[\s\-\.]', '', message_text.strip())
            search_result = await crawler_service.search_all_sources(clean_phone)
            response_text = await format_scam_results_for_zalo(search_result)
            
        elif is_bank_account(message_text):
            # Search bank account
            search_result = await crawler_service.search_all_sources(message_text)
            response_text = await format_scam_results_for_zalo(search_result)
            
        else:
            # AI chat
            print(f"🤖 Calling AI chat for message: {message_text[:50]}...")
            response_text = await ai_service.chat(message_text, context=None)
            print(f"✅ AI response: {response_text[:100]}...")
        
        # Send response
        print(f"📤 Sending response to user {user_id}: {response_text[:100]}...")
        send_result = await zalo_service.send_text_message(user_id, response_text)
        print(f"📨 Send result: {send_result}")
        
        # Save outgoing message
        outgoing_msg = ZaloMessage(
            zalo_user_id=user_id,
            message_type="text",
            message_content=response_text,
            is_from_user=False
        )
        db.add(outgoing_msg)
        db.commit()
        
    except Exception as e:
        print(f"Handle text message error: {e}")
        db.rollback()


async def handle_image_message(data: dict, db: Session):
    """Handle image message from user"""
    try:
        sender = data.get("sender", {})
        user_id = sender.get("id")
        
        response_text = """📸 Cảm ơn bạn đã gửi hình ảnh!

Tính năng phân tích hình ảnh đang được phát triển.
Hiện tại, bạn có thể:
- Gửi số điện thoại để kiểm tra
- Gửi số tài khoản để tra cứu
- Hỏi tôi về phòng chống lừa đảo"""
        
        await zalo_service.send_text_message(user_id, response_text)
        
        # Save message
        incoming_msg = ZaloMessage(
            zalo_user_id=user_id,
            message_type="image",
            message_content="[Image]",
            is_from_user=True
        )
        db.add(incoming_msg)
        db.commit()
        
    except Exception as e:
        print(f"Handle image message error: {e}")
        db.rollback()


async def handle_follow(data: dict, db: Session):
    """Handle user follow event"""
    try:
        follower = data.get("follower", {})
        user_id = follower.get("id")
        
        if not user_id:
            return
        
        # Get user profile
        profile = await zalo_service.get_user_profile(user_id)
        profile_data = profile.get("data", {})
        
        # Save or update user
        zalo_user = db.query(ZaloUser).filter(ZaloUser.zalo_user_id == user_id).first()
        
        if not zalo_user:
            zalo_user = ZaloUser(
                zalo_user_id=user_id,
                display_name=profile_data.get("display_name", ""),
                avatar=profile_data.get("avatar", ""),
                is_active=True
            )
            db.add(zalo_user)
        else:
            zalo_user.is_active = True
            zalo_user.display_name = profile_data.get("display_name", zalo_user.display_name)
            zalo_user.avatar = profile_data.get("avatar", zalo_user.avatar)
        
        db.commit()
        
        # Send welcome message
        welcome_text = """🎉 Chào mừng bạn đến với Anti-Scam!

Tôi là trợ lý AI giúp bạn:
✅ Kiểm tra số điện thoại lừa đảo
✅ Tra cứu tài khoản ngân hàng
✅ Phân tích tin nhắn nghi ngờ
✅ Tư vấn phòng chống lừa đảo

💡 Gửi /help để xem hướng dẫn chi tiết.

Hãy gửi số điện thoại hoặc câu hỏi để bắt đầu! 🔍"""
        
        await zalo_service.send_text_message(user_id, welcome_text)
        
    except Exception as e:
        print(f"Handle follow error: {e}")
        db.rollback()


async def handle_unfollow(data: dict, db: Session):
    """Handle user unfollow event"""
    try:
        follower = data.get("follower", {})
        user_id = follower.get("id")
        
        if not user_id:
            return
        
        # Mark user as inactive
        zalo_user = db.query(ZaloUser).filter(ZaloUser.zalo_user_id == user_id).first()
        if zalo_user:
            zalo_user.is_active = False
            db.commit()
        
    except Exception as e:
        print(f"Handle unfollow error: {e}")
        db.rollback()


@router.post("/send", response_model=ZaloSendMessageResponse)
async def send_message(request: ZaloSendMessageRequest):
    """Send message to a specific user (for testing/admin use)"""
    try:
        result = await zalo_service.send_text_message(
            request.user_id,
            request.message
        )
        
        if result.get("error") == 0:
            return ZaloSendMessageResponse(
                success=True,
                message_id=result.get("data", {}).get("message_id")
            )
        else:
            return ZaloSendMessageResponse(
                success=False,
                error=result.get("message")
            )
            
    except Exception as e:
        return ZaloSendMessageResponse(
            success=False,
            error=str(e)
        )


@router.get("/followers")
async def get_followers(
    offset: int = 0,
    count: int = 50
):
    """Get list of OA followers"""
    try:
        result = await zalo_service.get_follower_list(offset, count)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
