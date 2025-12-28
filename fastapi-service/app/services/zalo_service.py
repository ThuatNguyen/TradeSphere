"""Zalo OA service"""
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from ..config import settings
import hmac
import hashlib


class ZaloService:
    """Zalo Official Account service"""
    
    def __init__(self):
        self.access_token = settings.ZALO_ACCESS_TOKEN
        self.secret_key = settings.ZALO_SECRET_KEY
        self.base_url = settings.ZALO_API_URL
    
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Zalo webhook signature"""
        if not self.secret_key or not signature:
            return False
        
        try:
            expected_signature = hmac.new(
                self.secret_key.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False
    
    async def send_text_message(self, user_id: str, text: str) -> Dict[str, Any]:
        """Send text message to user"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/message",
                    headers={
                        "access_token": self.access_token,
                        "Content-Type": "application/json",
                    },
                    json={
                        "recipient": {"user_id": user_id},
                        "message": {"text": text}
                    },
                    timeout=10.0
                )
                
                return response.json()
                
        except Exception as e:
            return {
                "error": -1,
                "message": str(e)
            }
    
    async def send_template_message(
        self, 
        user_id: str, 
        template_id: str,
        template_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send template message (buttons, list, etc.)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/message",
                    headers={
                        "access_token": self.access_token,
                        "Content-Type": "application/json",
                    },
                    json={
                        "recipient": {"user_id": user_id},
                        "message": {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_id": template_id,
                                    "template_data": template_data
                                }
                            }
                        }
                    },
                    timeout=10.0
                )
                
                return response.json()
                
        except Exception as e:
            return {
                "error": -1,
                "message": str(e)
            }
    
    async def get_follower_list(self, offset: int = 0, count: int = 50) -> Dict[str, Any]:
        """Get list of followers"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/getfollowers",
                    headers={"access_token": self.access_token},
                    params={"offset": offset, "count": count},
                    timeout=10.0
                )
                
                return response.json()
                
        except Exception as e:
            return {
                "error": -1,
                "message": str(e),
                "data": {"followers": []}
            }
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/getprofile",
                    headers={"access_token": self.access_token},
                    params={"user_id": user_id},
                    timeout=10.0
                )
                
                return response.json()
                
        except Exception as e:
            return {
                "error": -1,
                "message": str(e)
            }
    
    async def send_broadcast(
        self, 
        message: str, 
        target_users: Optional[List[str]] = None,
        campaign_id: Optional[int] = None,
        rate_limit_delay: float = 1.5
    ) -> Dict[str, Any]:
        """
        Send broadcast message to multiple users with rate limiting
        
        Args:
            message: Message content
            target_users: List of user IDs (if None, get all followers)
            campaign_id: Campaign ID for logging
            rate_limit_delay: Delay between messages in seconds (default 1.5s = 40 msg/min)
        """
        if not target_users:
            # Get all followers
            followers_response = await self.get_follower_list()
            followers_data = followers_response.get("data", {})
            followers = followers_data.get("followers", [])
            target_users = [f["user_id"] for f in followers]
        
        results = {
            "total": len(target_users),
            "success": 0,
            "failed": 0,
            "errors": [],
            "logs": []
        }
        
        print(f"📊 Starting broadcast to {len(target_users)} users...")
        
        for idx, user_id in enumerate(target_users, 1):
            try:
                # Send message with retry
                result = await self._send_with_retry(user_id, message, max_retries=2)
                
                if result.get("error") == 0:
                    results["success"] += 1
                    results["logs"].append({
                        "user_id": user_id,
                        "status": "success"
                    })
                    print(f"✅ [{idx}/{len(target_users)}] Sent to {user_id}")
                else:
                    results["failed"] += 1
                    error_msg = result.get("message", "Unknown error")
                    results["errors"].append({
                        "user_id": user_id,
                        "error": error_msg
                    })
                    results["logs"].append({
                        "user_id": user_id,
                        "status": "failed",
                        "error": error_msg
                    })
                    print(f"❌ [{idx}/{len(target_users)}] Failed for {user_id}: {error_msg}")
                
                # Rate limiting: delay between messages
                if idx < len(target_users):
                    await asyncio.sleep(rate_limit_delay)
                    
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "user_id": user_id,
                    "error": str(e)
                })
                results["logs"].append({
                    "user_id": user_id,
                    "status": "failed",
                    "error": str(e)
                })
                print(f"⚠️ [{idx}/{len(target_users)}] Exception for {user_id}: {e}")
        
        print(f"🎉 Broadcast completed: {results['success']}/{results['total']} success")
        return results
    
    async def _send_with_retry(
        self, 
        user_id: str, 
        message: str, 
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """Send message with retry logic"""
        for attempt in range(max_retries):
            try:
                result = await self.send_text_message(user_id, message)
                
                # If success or non-retryable error, return
                if result.get("error") == 0 or result.get("error") in [-216, -124]:
                    return result
                
                # Retry on other errors
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    return {"error": -1, "message": str(e)}
                await asyncio.sleep(1)
        
        return result


# Singleton instance
zalo_service = ZaloService()
