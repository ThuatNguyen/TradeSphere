"""API v1 router"""
from fastapi import APIRouter
from .endpoints import scams, ai, zalo, cache, notifications

api_router = APIRouter()

# Include routers
api_router.include_router(scams.router, prefix="/scams", tags=["Scam Search"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Services"])
api_router.include_router(zalo.router, prefix="/zalo", tags=["Zalo OA"])
api_router.include_router(cache.router, prefix="/cache", tags=["Cache Management"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
