"""
MCP Client Tools for connecting to Deepify MCP Server

These tools enable Pydantic AI agents to communicate with your existing
Deepify MCP Server, calling tools like parsePRP, createTask, etc.
"""

import httpx
import json
import logging
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MCPClientConfig:
    """Configuration for MCP client connection"""
    server_url: str
    github_token: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3


class MCPClientError(Exception):
    """Base exception for MCP client errors"""
    pass


class MCPAuthenticationError(MCPClientError):
    """Authentication failed with MCP server"""
    pass


class MCPServerError(MCPClientError):
    """MCP server returned an error"""
    pass


class MCPClient:
    """
    HTTP client for communicating with MCP servers via HTTP transport.
    
    This client handles:
    - Tool discovery and invocation
    - Authentication with GitHub OAuth
    - Error handling and retries
    - Response parsing and validation
    """
    
    def __init__(self, config: MCPClientConfig):
        self.config = config
        self.client = httpx.AsyncClient(
            timeout=config.timeout,
            headers=self._get_headers()
        )
        self._available_tools: Optional[List[str]] = None
    
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for MCP requests"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Research-Agent-MCP-Client/1.0"
        }
        
        if self.config.github_token:
            headers["Authorization"] = f"Bearer {self.config.github_token}"
        
        return headers
    
    async def discover_tools(self) -> List[str]:
        """
        Discover available tools from the MCP server
        
        Returns:
            List of tool names available on the server
        """
        try:
            # MCP servers expose tools via the tools/list endpoint
            response = await self.client.post(
                f"{self.config.server_url}/tools/list",
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
            )
            response.raise_for_status()
            
            data = response.json()
            if "error" in data:
                raise MCPServerError(f"Tool discovery failed: {data['error']}")
            
            tools = data.get("result", {}).get("tools", [])
            self._available_tools = [tool["name"] for tool in tools]
            
            logger.info(f"Discovered {len(self._available_tools)} tools: {self._available_tools}")
            return self._available_tools
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise MCPAuthenticationError("GitHub authentication required for MCP server")
            raise MCPClientError(f"HTTP error during tool discovery: {e}")
        except Exception as e:
            raise MCPClientError(f"Failed to discover tools: {e}")
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a tool on the MCP server
        
        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments as a dictionary
            
        Returns:
            Tool response data
        """
        try:
            # Prepare MCP tool call request
            request_data = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments
                }
            }
            
            logger.info(f"Calling MCP tool: {tool_name} with args: {arguments}")
            
            response = await self.client.post(
                f"{self.config.server_url}/tools/call",
                json=request_data
            )
            response.raise_for_status()
            
            data = response.json()
            
            if "error" in data:
                error_msg = data["error"].get("message", "Unknown MCP error")
                raise MCPServerError(f"Tool '{tool_name}' failed: {error_msg}")
            
            result = data.get("result", {})
            logger.info(f"Tool '{tool_name}' completed successfully")
            
            return result
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise MCPAuthenticationError(f"Authentication failed for tool '{tool_name}'")
            elif e.response.status_code == 404:
                raise MCPClientError(f"Tool '{tool_name}' not found on server")
            raise MCPClientError(f"HTTP error calling tool '{tool_name}': {e}")
        except Exception as e:
            raise MCPClientError(f"Failed to call tool '{tool_name}': {e}")
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Convenience functions for specific MCP tools
async def parse_prp_via_mcp(
    client: MCPClient,
    prp_content: str,
    project_name: Optional[str] = None,
    project_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Parse a PRP using the MCP server's parsePRP tool
    
    Args:
        client: MCP client instance
        prp_content: The PRP content to parse
        project_name: Optional project name
        project_context: Optional project context
        
    Returns:
        Parsed PRP data with tasks, documentation, and metadata
    """
    arguments = {"prpContent": prp_content}
    
    if project_name:
        arguments["projectName"] = project_name
    
    if project_context:
        arguments["projectContext"] = project_context
    
    return await client.call_tool("parsePRP", arguments)


async def create_task_via_mcp(
    client: MCPClient,
    title: str,
    description: str,
    project_name: str,
    priority: str = "medium",
    estimated_hours: Optional[int] = None,
    assigned_to: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Create a task using the MCP server's createTask tool
    
    Args:
        client: MCP client instance
        title: Task title
        description: Task description
        project_name: Project name
        priority: Task priority (low, medium, high, critical)
        estimated_hours: Estimated hours to complete
        assigned_to: GitHub username to assign task to
        tags: List of tags to associate with task
        
    Returns:
        Created task data
    """
    arguments = {
        "title": title,
        "description": description,
        "projectName": project_name,
        "priority": priority
    }
    
    if estimated_hours is not None:
        arguments["estimatedHours"] = estimated_hours
    
    if assigned_to:
        arguments["assignedTo"] = assigned_to
    
    if tags:
        arguments["tags"] = tags
    
    return await client.call_tool("createTask", arguments)


async def create_documentation_via_mcp(
    client: MCPClient,
    title: str,
    content: str,
    doc_type: str,
    project_name: str,
    importance: str = "medium",
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Create documentation using the MCP server's createDocumentation tool
    
    Args:
        client: MCP client instance
        title: Documentation title
        content: Documentation content
        doc_type: Type of documentation (guide, reference, api, etc.)
        project_name: Project name
        importance: Documentation importance (low, medium, high, critical)
        tags: List of tags to associate with documentation
        
    Returns:
        Created documentation data
    """
    arguments = {
        "title": title,
        "content": content,
        "type": doc_type,
        "projectName": project_name,
        "importance": importance
    }
    
    if tags:
        arguments["tags"] = tags
    
    return await client.call_tool("createDocumentation", arguments)


async def list_tasks_via_mcp(
    client: MCPClient,
    project_name: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    List tasks using the MCP server's listTasks tool
    
    Args:
        client: MCP client instance
        project_name: Filter by project name
        status: Filter by task status
        assigned_to: Filter by assignee
        limit: Maximum number of tasks to return
        
    Returns:
        List of tasks matching the filters
    """
    arguments = {"limit": limit}
    
    if project_name:
        arguments["projectName"] = project_name
    
    if status:
        arguments["status"] = status
    
    if assigned_to:
        arguments["assignedTo"] = assigned_to
    
    return await client.call_tool("listTasks", arguments)


async def get_project_status_via_mcp(
    client: MCPClient,
    project_name: str
) -> Dict[str, Any]:
    """
    Get comprehensive project status by combining multiple MCP calls
    
    Args:
        client: MCP client instance
        project_name: Project name to get status for
        
    Returns:
        Combined project status with tasks, documentation, and metrics
    """
    try:
        # Get tasks for the project
        tasks_result = await list_tasks_via_mcp(client, project_name=project_name)
        
        # Get documentation for the project (assuming there's a listDocumentation tool)
        try:
            docs_result = await client.call_tool("listDocumentation", {"projectName": project_name})
        except MCPClientError:
            # Fallback if listDocumentation doesn't exist
            docs_result = {"content": [{"text": "Documentation listing not available"}]}
        
        # Combine the results
        return {
            "project_name": project_name,
            "tasks": tasks_result,
            "documentation": docs_result,
            "status": "active"
        }
        
    except Exception as e:
        raise MCPClientError(f"Failed to get project status for '{project_name}': {e}")