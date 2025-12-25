"""AI endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from ....schemas import (
    AIChatRequest, AIChatResponse, 
    AIAnalyzeRequest, AIAnalyzeResponse
)
from ....services import ai_service
from ....database import get_db
from ....models import ChatMessage
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    request: AIChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with AI assistant about scam prevention
    
    - **message**: User's message
    - **session_id**: Optional session ID for context
    - **context**: Optional previous conversation context
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get AI response
        response_text = await ai_service.chat(
            message=request.message,
            context=request.context
        )
        
        # Save to database (optional, for analytics)
        try:
            # Save user message
            user_msg = ChatMessage(
                session_id=session_id,
                message=request.message,
                is_user=True
            )
            db.add(user_msg)
            
            # Save AI response
            ai_msg = ChatMessage(
                session_id=session_id,
                message=response_text,
                is_user=False
            )
            db.add(ai_msg)
            db.commit()
        except Exception as e:
            print(f"Failed to save chat: {e}")
            db.rollback()
        
        return AIChatResponse(
            response=response_text,
            session_id=session_id,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")


@router.post("/analyze", response_model=AIAnalyzeResponse)
async def analyze_text(request: AIAnalyzeRequest):
    """
    Analyze text for scam indicators
    
    - **text**: Text to analyze (message, email, etc.)
    
    Returns analysis with confidence score and indicators
    """
    try:
        result = await ai_service.analyze_scam_text(request.text)
        
        return AIAnalyzeResponse(
            is_scam=result.get("is_scam", False),
            confidence=result.get("confidence", 0),
            indicators=result.get("indicators", []),
            explanation=result.get("explanation", "")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
