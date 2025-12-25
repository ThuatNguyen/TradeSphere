"""Cache management endpoints"""
from fastapi import APIRouter, HTTPException
from ....schemas import CacheStatsResponse
from ....services import cache_service

router = APIRouter()


@router.get("/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = await cache_service.get_stats()
        
        # Calculate hit rate (placeholder - implement proper tracking)
        total_hits = stats.get("total_hits", 0)
        total_requests = stats.get("total_requests", 1)
        hit_rate = (total_hits / total_requests * 100) if total_requests > 0 else 0
        
        return CacheStatsResponse(
            total_cached=stats.get("scam_search_keys", 0),
            hit_rate=hit_rate,
            total_hits=total_hits,
            cache_size_mb=stats.get("memory_used_mb", 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")


@router.delete("/clear")
async def clear_cache(pattern: str = "scam:search:*"):
    """
    Clear cache entries matching pattern
    
    - **pattern**: Redis key pattern (e.g., "scam:search:*")
    """
    try:
        deleted_count = await cache_service.clear_pattern(pattern)
        return {
            "success": True,
            "message": f"Cleared {deleted_count} cache entries",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")
