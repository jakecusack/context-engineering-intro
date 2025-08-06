"""
Non-secret configuration for Research Agent MCP Integration

This avoids .env files entirely and uses only non-sensitive configuration.
All secrets are managed via GitHub Actions in the MCP server.
"""

# Production MCP server (deployed via GitHub Actions)
PRODUCTION_MCP_URL = "https://your-deepify-worker.workers.dev/mcp"

# Local development MCP server (if testing locally)
LOCAL_MCP_URL = "http://localhost:8787/mcp"

# Default configuration (no secrets)
DEFAULT_CONFIG = {
    "mcp_server_url": PRODUCTION_MCP_URL,  # Use production by default
    "timeout": 30,
    "max_retries": 3,
    "log_level": "INFO"
}

# Research agent settings (non-sensitive)
RESEARCH_CONFIG = {
    "max_search_results": 10,
    "max_concurrent_requests": 5,
    "default_model_provider": "anthropic",  # Uses MCP server's API keys
    "default_model": "claude-3-5-sonnet-20241022"
}

print("🔐 Security Note: All API keys and secrets are managed via GitHub Actions")
print("📡 MCP Server handles authentication and AI API calls securely")
print("🧪 This config only contains non-sensitive settings")