"""
Application configuration using Pydantic BaseSettings.
All settings are loaded from environment variables (or .env file).
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/docmind"

    # Gemini (chat model)
    GEMINI_API_KEY: str

    # Pinecone (integrated embedding — multilingual-e5-large, 1024-dim, cosine)
    PINECONE_API_KEY: str
    PINECONE_INDEX_HOST: str
    PINECONE_INDEX_NAME: str = "docmind"
    PINECONE_EMBEDDING_MODEL: str = "multilingual-e5-large"
    PINECONE_DIMENSIONS: int = 1024

    # Upstash Redis
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str

    # Auth
    JWT_SECRET: str

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # App
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
