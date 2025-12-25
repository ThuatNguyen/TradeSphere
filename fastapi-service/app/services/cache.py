"""Redis cache service"""
from redis import asyncio as aioredis
import json
from typing import Optional, Any
from datetime import datetime, timedelta
from ..config import settings


class CacheService:
    """Redis-based caching service"""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        if not self.redis:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
    
    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            await self.connect()
            data = await self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache"""
        try:
            await self.connect()
            ttl = ttl or settings.CACHE_TTL
            serialized = json.dumps(value, ensure_ascii=False)
            await self.redis.setex(key, ttl, serialized)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            await self.connect()
            await self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            await self.connect()
            keys = []
            async for key in self.redis.scan_iter(pattern):
                keys.append(key)
            
            if keys:
                return await self.redis.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache clear error: {e}")
            return 0
    
    async def get_scam_search(self, keyword: str, source: str = "all") -> Optional[dict]:
        """Get cached scam search result"""
        key = f"scam:search:{source}:{keyword}"
        return await self.get(key)
    
    async def set_scam_search(self, keyword: str, data: dict, source: str = "all", ttl: int = None) -> bool:
        """Cache scam search result"""
        key = f"scam:search:{source}:{keyword}"
        return await self.set(key, data, ttl)
    
    async def increment_hit(self, key: str) -> int:
        """Increment cache hit counter"""
        try:
            await self.connect()
            return await self.redis.incr(f"{key}:hits")
        except Exception as e:
            print(f"Cache increment error: {e}")
            return 0
    
    async def get_stats(self) -> dict:
        """Get cache statistics"""
        try:
            await self.connect()
            info = await self.redis.info()
            
            # Count keys
            scam_keys = 0
            async for _ in self.redis.scan_iter("scam:search:*"):
                scam_keys += 1
            
            return {
                "total_keys": info.get("db0", {}).get("keys", 0),
                "scam_search_keys": scam_keys,
                "memory_used_mb": info.get("used_memory", 0) / (1024 * 1024),
                "connected_clients": info.get("connected_clients", 0),
                "uptime_days": info.get("uptime_in_days", 0),
            }
        except Exception as e:
            print(f"Cache stats error: {e}")
            return {}


# Singleton instance
cache_service = CacheService()
