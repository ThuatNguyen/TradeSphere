"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "Anti-Scam API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tradesphere"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600  # 1 hour
    
    # Security
    API_SECRET_KEY: str = "your-secret-key-change-this"
    PYTHON_API_KEY: str = "your-api-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI Services
    OPENAI_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-3.5-turbo"
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 500
    
    # Zalo OA
    ZALO_OA_ID: str = ""
    ZALO_ACCESS_TOKEN: str = ""
    ZALO_SECRET_KEY: str = ""
    ZALO_API_URL: str = "https://openapi.zalo.me/v2.0/oa"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5000",
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "60/minute"
    RATE_LIMIT_SEARCH: str = "10/minute"
    
    # Selenium
    SELENIUM_HEADLESS: bool = True
    SELENIUM_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


settings = Settings()
