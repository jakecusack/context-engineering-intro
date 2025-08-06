"""
Configuration settings for the Research Agent MCP Integration
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Research API keys
    brave_api_key: str = Field(..., description="Brave Search API key")
    anthropic_api_key: str = Field(..., description="Anthropic API key for PRP generation")
    
    # MCP server connection
    mcp_server_url: str = Field(
        default="http://localhost:8787/mcp", 
        description="URL of the Deepify MCP server"
    )
    github_token: Optional[str] = Field(
        default=None, 
        description="GitHub personal access token for MCP authentication"
    )
    
    # Optional: Additional LLM providers
    openai_api_key: Optional[str] = Field(
        default=None, 
        description="OpenAI API key (optional)"
    )
    
    # Agent configuration
    default_model_provider: str = Field(
        default="anthropic", 
        description="Default LLM provider (anthropic, openai)"
    )
    default_model: str = Field(
        default="claude-3-5-sonnet-20241022", 
        description="Default model name"
    )
    max_search_results: int = Field(
        default=10, 
        description="Maximum number of search results to retrieve"
    )
    max_concurrent_requests: int = Field(
        default=5, 
        description="Maximum concurrent HTTP requests"
    )
    
    # Development settings
    log_level: str = Field(default="INFO", description="Logging level")
    environment: str = Field(default="development", description="Environment (development, production)")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()