"""
LLM provider configuration for Pydantic AI agents
"""

from typing import Union
from pydantic_ai.models import Model, KnownModelName
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIModel
from .settings import settings


def get_llm_model(
    provider: str = None,
    model_name: str = None
) -> Model:
    """
    Get configured LLM model for Pydantic AI agents
    
    Args:
        provider: Model provider (anthropic, openai) - defaults to settings
        model_name: Specific model name - defaults to settings
        
    Returns:
        Configured Pydantic AI model instance
    """
    provider = provider or settings.default_model_provider
    model_name = model_name or settings.default_model
    
    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        return AnthropicModel(
            model_name=model_name,
            api_key=settings.anthropic_api_key
        )
    
    elif provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        return OpenAIModel(
            model_name=model_name,
            api_key=settings.openai_api_key
        )
    
    else:
        raise ValueError(f"Unsupported model provider: {provider}")


def get_anthropic_model(model_name: str = None) -> AnthropicModel:
    """Get Anthropic model specifically"""
    return get_llm_model("anthropic", model_name)


def get_openai_model(model_name: str = None) -> OpenAIModel:
    """Get OpenAI model specifically"""
    return get_llm_model("openai", model_name)