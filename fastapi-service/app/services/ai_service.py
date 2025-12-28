"""AI service for chatbot and scam analysis"""
from openai import AsyncOpenAI
from typing import List, Dict, Optional
import json
from ..config import settings


# AI Prompts
ANTI_SCAM_SYSTEM_PROMPT = """
Bạn là trợ lý AI chuyên về phòng chống lừa đảo tại Việt Nam.

Nhiệm vụ của bạn:
- Tư vấn cách nhận biết các chiêu thức lừa đảo phổ biến
- Phân tích thông tin nghi ngờ (số điện thoại, tin nhắn, email)
- Đưa ra cảnh báo và khuyến nghị cụ thể
- Hướng dẫn cách báo cáo và xử lý khi gặp lừa đảo

Phong cách giao tiếp:
- Thân thiện, dễ hiểu, không dùng thuật ngữ phức tạp
- Cụ thể, có ví dụ minh họa
- Luôn khuyến khích người dùng cảnh giác
- Trả lời ngắn gọn, súc tích (3-5 câu)

Lưu ý:
- KHÔNG đưa ra lời khuyên pháp lý chính thức
- KHÔNG khẳng định 100% ai đó là lừa đảo nếu chưa có bằng chứng rõ ràng
- LUÔN khuyên người dùng kiểm chứng kỹ và báo cơ quan chức năng
"""

ANALYZE_SCAM_PROMPT_TEMPLATE = """
Phân tích đoạn văn bản sau để xác định khả năng lừa đảo:

Văn bản: {text}

Các dấu hiệu lừa đảo thường gặp:
- Yêu cầu chuyển tiền gấp, khẩn cấp
- Mạo danh cơ quan chức năng, ngân hàng
- Hứa hẹn lợi nhuận cao, nhanh chóng, không rủi ro
- Đe dọa, gây áp lực tâm lý
- Lỗi chính tả, ngữ pháp
- Link rút gọn hoặc link lạ
- Yêu cầu thông tin cá nhân nhạy cảm

Trả về JSON với format:
{{
  "is_scam": true/false,
  "confidence": 0-100,
  "indicators": ["dấu hiệu 1", "dấu hiệu 2", ...],
  "explanation": "Giải thích chi tiết ngắn gọn"
}}
"""


class AIService:
    """OpenAI-based AI service"""
    
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def chat(
        self, 
        message: str, 
        context: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Chat with AI"""
        if not self.client:
            error_msg = "AI service chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY."
            print(f"❌ {error_msg}")
            return error_msg
        
        print(f"🤖 AI chat called with model: {settings.AI_MODEL}")
        print(f"📝 Message: {message[:100]}...")
        
        try:
            messages = [
                {"role": "system", "content": ANTI_SCAM_SYSTEM_PROMPT}
            ]
            
            # Add context (previous messages)
            if context:
                messages.extend(context[-5:])  # Last 5 messages only
            
            messages.append({"role": "user", "content": message})
            
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=messages,
                temperature=settings.AI_TEMPERATURE,
                max_tokens=settings.AI_MAX_TOKENS,
            )
            
            ai_response = response.choices[0].message.content
            print(f"✅ AI responded: {ai_response[:100]}...")
            return ai_response
            
        except Exception as e:
            error_msg = f"Lỗi AI service: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg
    
    async def analyze_scam_text(self, text: str) -> Dict:
        """Analyze text for scam indicators"""
        if not self.client:
            return {
                "is_scam": False,
                "confidence": 0,
                "indicators": [],
                "explanation": "AI service chưa được cấu hình"
            }
        
        try:
            prompt = ANALYZE_SCAM_PROMPT_TEMPLATE.format(text=text)
            
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temperature for more consistent analysis
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            return {
                "is_scam": False,
                "confidence": 0,
                "indicators": [],
                "explanation": f"Lỗi phân tích: {str(e)}"
            }
    
    async def generate_scam_report_summary(self, phone: str, name: str, amount: int) -> str:
        """Generate natural language summary for scam report"""
        if not self.client:
            return f"Cảnh báo: {name} ({phone}) - Số tiền: {amount:,} VNĐ"
        
        try:
            prompt = f"""
            Viết một cảnh báo ngắn gọn (1-2 câu) về vụ lừa đảo:
            - Tên: {name}
            - Số điện thoại: {phone}
            - Số tiền: {amount:,} VNĐ
            
            Giọng điệu: Cảnh báo nhưng không phán xét.
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=100,
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"⚠️ Cảnh báo: {name} ({phone}) liên quan đến giao dịch nghi ngờ số tiền {amount:,} VNĐ"


# Singleton instance
ai_service = AIService()
