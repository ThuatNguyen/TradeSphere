"""Scam search endpoints"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from ....schemas import ScamSearchResponse
from ....services import crawler_service, cache_service
from ....database import get_db
from ....models import ScamSearch
from sqlalchemy.orm import Session
import time

router = APIRouter()


@router.get("/search", response_model=ScamSearchResponse)
async def search_scams(
    keyword: str = Query(..., min_length=1, max_length=255, description="Phone number, account number, or name"),
    type: Optional[str] = Query(None, regex="^(admin|checkscam|scam|chongluadao|all)$", description="Source type"),
    db: Session = Depends(get_db)
):
    """
    Search for scam reports across multiple sources
    
    - **keyword**: Phone number, bank account, or name to search
    - **type**: Source to search (admin, checkscam, scam, chongluadao, or all). Default: all
    """
    start_time = time.time()
    source_type = type or "all"
    
    # Check cache first
    cached_result = await cache_service.get_scam_search(keyword, source_type)
    if cached_result:
        cached_result["cached"] = True
        cached_result["response_time_ms"] = int((time.time() - start_time) * 1000)
        
        # Increment cache hit
        await cache_service.increment_hit(f"scam:search:{source_type}:{keyword}")
        
        return cached_result
    
    try:
        # Perform search
        if source_type == "all":
            result = await crawler_service.search_all_sources(keyword)
        elif source_type == "admin":
            driver = crawler_service.init_driver()
            result = crawler_service.scrape_admin_vn(keyword, driver)
            result = {
                "success": result["success"],
                "keyword": keyword,
                "total_results": int(result.get("total_scams", 0)) if str(result.get("total_scams", "0")).isdigit() else 0,
                "sources": [result]
            }
        elif source_type == "checkscam":
            driver = crawler_service.init_driver()
            result = crawler_service.scrape_checkscam_vn(keyword, driver)
            result = {
                "success": result["success"],
                "keyword": keyword,
                "total_results": int(result.get("total_scams", 0)) if str(result.get("total_scams", "0")).isdigit() else 0,
                "sources": [result]
            }
        elif source_type == "scam":
            driver = crawler_service.init_driver()
            result = crawler_service.scrape_scam_vn(keyword, driver)
            result = {
                "success": result["success"],
                "keyword": keyword,
                "total_results": int(result.get("total_scams", 0)) if str(result.get("total_scams", "0")).isdigit() else 0,
                "sources": [result]
            }
        elif source_type == "chongluadao":
            result = await crawler_service.scrape_chongluadao_vn(keyword)
            result = {
                "success": result["success"],
                "keyword": keyword,
                "total_results": result.get("total_scams", 0),
                "sources": [result]
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid source type")
        
        response_time_ms = int((time.time() - start_time) * 1000)
        result["cached"] = False
        result["response_time_ms"] = response_time_ms
        
        # Cache the result
        await cache_service.set_scam_search(keyword, result, source_type)
        
        # Log search to database
        try:
            search_log = ScamSearch(
                keyword=keyword,
                source="web",
                results_count=result["total_results"],
                response_time_ms=response_time_ms
            )
            db.add(search_log)
            db.commit()
        except Exception as e:
            print(f"Failed to log search: {e}")
            db.rollback()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/admin")
async def search_admin_vn(
    keyword: str = Query(..., min_length=1, description="Keyword to search"),
    db: Session = Depends(get_db)
):
    """Search admin.vn only"""
    return await search_scams(keyword=keyword, type="admin", db=db)


@router.get("/checkscam")
async def search_checkscam_vn(
    keyword: str = Query(..., min_length=1, description="Keyword to search"),
    db: Session = Depends(get_db)
):
    """Search checkscam.vn only"""
    return await search_scams(keyword=keyword, type="checkscam", db=db)


@router.get("/scam")
async def search_scam_vn(
    keyword: str = Query(..., min_length=1, description="Keyword to search"),
    db: Session = Depends(get_db)
):
    """Search scam.vn only"""
    return await search_scams(keyword=keyword, type="scam", db=db)


@router.get("/chongluadao")
async def search_chongluadao_vn(
    keyword: str = Query(..., min_length=1, description="Keyword to search"),
    db: Session = Depends(get_db)
):
    """Search chongluadao.vn only"""
    return await search_scams(keyword=keyword, type="chongluadao", db=db)
