"""Zalo OA service"""
import httpx
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
        target_users: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Send broadcast message to multiple users"""
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
            "errors": []
        }
        
        for user_id in target_users:
            result = await self.send_text_message(user_id, message)
            if result.get("error") == 0:
                results["success"] += 1
            else:
                results["failed"] += 1
                results["errors"].append({
                    "user_id": user_id,
                    "error": result.get("message")
                })
        
        return results


# Singleton instance
zalo_service = ZaloService()
