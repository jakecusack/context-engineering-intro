"""
Basic tests for MCP integration functionality
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from tools.mcp_client import MCPClient, MCPClientConfig, MCPClientError
from models.research_models import ResearchRequest
from models.project_models import TaskPriority, DocumentationType


class TestMCPClient:
    """Test MCP client functionality"""
    
    @pytest.fixture
    def mcp_config(self):
        """MCP client configuration for testing"""
        return MCPClientConfig(
            server_url="http://localhost:8787/mcp",
            github_token="test_token",
            timeout=10
        )
    
    @pytest.fixture
    def mock_httpx_client(self):
        """Mock httpx client for testing"""
        client = AsyncMock()
        return client
    
    def test_mcp_config_creation(self, mcp_config):
        """Test MCP configuration creation"""
        assert mcp_config.server_url == "http://localhost:8787/mcp"
        assert mcp_config.github_token == "test_token"
        assert mcp_config.timeout == 10
    
    @pytest.mark.asyncio
    async def test_tool_discovery_success(self, mcp_config, monkeypatch):
        """Test successful tool discovery"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "result": {
                "tools": [
                    {"name": "parsePRP"},
                    {"name": "createTask"},
                    {"name": "listTasks"}
                ]
            }
        }
        mock_response.raise_for_status.return_value = None
        
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.aclose = AsyncMock()
        
        # Patch httpx.AsyncClient
        def mock_async_client(*args, **kwargs):
            return mock_client
        
        monkeypatch.setattr("httpx.AsyncClient", mock_async_client)
        
        # Test tool discovery
        client = MCPClient(mcp_config)
        tools = await client.discover_tools()
        
        assert len(tools) == 3
        assert "parsePRP" in tools
        assert "createTask" in tools
        assert "listTasks" in tools
        
        await client.close()
    
    @pytest.mark.asyncio
    async def test_tool_call_success(self, mcp_config, monkeypatch):
        """Test successful tool call"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "result": {
                "content": [
                    {"type": "text", "text": "Task created successfully"}
                ]
            }
        }
        mock_response.raise_for_status.return_value = None
        
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.aclose = AsyncMock()
        
        def mock_async_client(*args, **kwargs):
            return mock_client
        
        monkeypatch.setattr("httpx.AsyncClient", mock_async_client)
        
        # Test tool call
        client = MCPClient(mcp_config)
        result = await client.call_tool("createTask", {"title": "Test Task"})
        
        assert "content" in result
        assert result["content"][0]["text"] == "Task created successfully"
        
        await client.close()
    
    @pytest.mark.asyncio
    async def test_authentication_error(self, mcp_config, monkeypatch):
        """Test authentication error handling"""
        # Mock 401 response
        from httpx import HTTPStatusError, Request, Response
        
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = HTTPStatusError(
            "401 Unauthorized",
            request=Request("POST", "http://test"),
            response=Response(401)
        )
        
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.aclose = AsyncMock()
        
        def mock_async_client(*args, **kwargs):
            return mock_client
        
        monkeypatch.setattr("httpx.AsyncClient", mock_async_client)
        
        # Test authentication error
        client = MCPClient(mcp_config)
        
        with pytest.raises(Exception):  # Should raise MCPAuthenticationError
            await client.discover_tools()
        
        await client.close()


class TestResearchModels:
    """Test research data models"""
    
    def test_research_request_creation(self):
        """Test research request model"""
        request = ResearchRequest(
            topic="Next.js 15 features",
            project_goals=["Learn new features", "Create migration plan"],
            search_depth=10
        )
        
        assert request.topic == "Next.js 15 features"
        assert len(request.project_goals) == 2
        assert request.search_depth == 10
        assert request.target_users is None
    
    def test_research_request_validation(self):
        """Test research request validation"""
        # Should work with minimal data
        request = ResearchRequest(topic="Test topic")
        assert request.topic == "Test topic"
        assert request.search_depth == 10  # default
        
        # Should validate search_depth range
        with pytest.raises(ValueError):
            ResearchRequest(topic="Test", search_depth=0)  # Below minimum
        
        with pytest.raises(ValueError):
            ResearchRequest(topic="Test", search_depth=25)  # Above maximum


class TestProjectModels:
    """Test project management data models"""
    
    def test_task_creation(self):
        """Test task model creation"""
        from models.project_models import Task, TaskStatus, TaskPriority
        
        task = Task(
            title="Test Task",
            description="Test description",
            project_name="test-project",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            created_by="testuser"
        )
        
        assert task.title == "Test Task"
        assert task.status == TaskStatus.TODO
        assert task.priority == TaskPriority.HIGH
        assert task.created_by == "testuser"
    
    def test_documentation_creation(self):
        """Test documentation model creation"""
        from models.project_models import Documentation, DocumentationType, DocumentationImportance
        
        doc = Documentation(
            title="Test Doc",
            content="Test content",
            type=DocumentationType.GUIDE,
            project_name="test-project",
            importance=DocumentationImportance.HIGH,
            created_by="testuser"
        )
        
        assert doc.title == "Test Doc"
        assert doc.type == DocumentationType.GUIDE
        assert doc.importance == DocumentationImportance.HIGH


# Integration test (requires running MCP server)
@pytest.mark.integration
class TestLiveIntegration:
    """Integration tests that require a running MCP server"""
    
    @pytest.mark.asyncio
    async def test_live_mcp_connection(self):
        """Test connection to live MCP server (requires server running)"""
        config = MCPClientConfig(
            server_url="http://localhost:8787/mcp",
            timeout=5
        )
        
        try:
            async with MCPClient(config) as client:
                tools = await client.discover_tools()
                assert isinstance(tools, list)
                # If this passes, we have a working connection
                
        except Exception as e:
            pytest.skip(f"MCP server not available: {e}")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])