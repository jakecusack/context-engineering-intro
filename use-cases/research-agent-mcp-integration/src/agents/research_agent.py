"""
Research Agent with MCP Integration

Intelligent research agent that combines web search, PRP generation,
and MCP server integration to create complete project workflows.
"""

import logging
import uuid
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from pydantic_ai import Agent, RunContext
from pydantic import BaseModel

from ..config.providers import get_llm_model
from ..config.settings import settings
from ..tools.web_search import WebSearchTool, WebSearchError
from ..tools.prp_writer import PRPWriter, ResearchInput, PRPWriterError
from ..tools.mcp_client import (
    MCPClient, MCPClientConfig, MCPClientError,
    parse_prp_via_mcp, create_task_via_mcp, create_documentation_via_mcp
)
from ..models.research_models import ResearchRequest, ResearchResponse, SearchResult
from ..models.project_models import PRPParsingResult

logger = logging.getLogger(__name__)


@dataclass
class ResearchAgentDependencies:
    """Dependencies for the research agent"""
    brave_api_key: str
    anthropic_api_key: str
    mcp_server_url: str
    github_token: Optional[str] = None
    session_id: Optional[str] = None


class ResearchOutput(BaseModel):
    """Structured output from research agent"""
    success: bool
    project_name: str
    search_results_count: int
    tasks_created: int
    documentation_created: int
    estimated_hours: int
    next_steps: List[str]
    error_message: Optional[str] = None


# System prompt for the research agent
RESEARCH_AGENT_PROMPT = """
You are an expert research and project management agent with the ability to:

1. **Conduct Web Research**: Search for current information on any technology, framework, or topic
2. **Generate PRPs**: Create comprehensive Product Requirements Prompts based on research findings
3. **Parse PRPs**: Use MCP server to extract structured tasks and documentation from PRPs
4. **Create Projects**: Automatically set up complete project structures with tasks and documentation

## Your Workflow:
1. **Research Phase**: Use web search to gather comprehensive information about the topic
2. **Analysis Phase**: Analyze research findings to identify key insights, best practices, and requirements
3. **PRP Generation**: Create a detailed Product Requirements Prompt based on research
4. **Project Creation**: Parse the PRP and create structured tasks and documentation via MCP server
5. **Summary**: Provide complete project status and recommended next steps

## Research Guidelines:
- Use specific, targeted search queries to gather comprehensive information
- Focus on latest best practices, common challenges, and recommended approaches
- Identify key technologies, tools, and implementation patterns
- Look for performance, security, and scalability considerations

## PRP Guidelines:
- Create detailed, actionable PRPs that can be parsed by AI systems
- Include specific technical requirements and constraints
- Provide realistic time estimates and priority levels
- Structure requirements to enable automatic task extraction

## Project Management:
- Create logical task breakdown with clear dependencies
- Generate appropriate documentation for different audiences
- Use consistent naming and tagging for organization
- Provide realistic estimates and milestone planning

Always strive to provide comprehensive, actionable project setups that teams can immediately begin working on.
"""


# Initialize the research agent
research_agent = Agent(
    get_llm_model(),
    deps_type=ResearchAgentDependencies,
    result_type=ResearchOutput,
    system_prompt=RESEARCH_AGENT_PROMPT
)


@research_agent.tool
async def search_web(
    ctx: RunContext[ResearchAgentDependencies],
    query: str,
    count: int = 10
) -> Dict[str, Any]:
    """
    Search the web for information on a specific topic
    
    Args:
        query: Search query to execute
        count: Number of results to return (1-20)
        
    Returns:
        Search results with analysis
    """
    try:
        async with WebSearchTool(ctx.deps.brave_api_key) as search_tool:
            results = await search_tool.search_with_analysis(query, count)
            
        logger.info(f"Web search completed: {query} -> {results['total_results']} results")
        return results
        
    except WebSearchError as e:
        logger.error(f"Web search failed: {e}")
        return {"error": str(e), "results": []}


@research_agent.tool
async def generate_prp_from_research(
    ctx: RunContext[ResearchAgentDependencies],
    topic: str,
    research_results: List[Dict[str, Any]],
    project_goals: Optional[List[str]] = None,
    target_users: Optional[List[str]] = None,
    timeline: Optional[str] = None
) -> str:
    """
    Generate a comprehensive PRP based on research findings
    
    Args:
        topic: Main topic/project name
        research_results: Web search results to base PRP on
        project_goals: Optional project goals
        target_users: Optional target users
        timeline: Optional project timeline
        
    Returns:
        Generated PRP content as markdown
    """
    try:
        writer = PRPWriter(ctx.deps.anthropic_api_key)
        
        research_input = ResearchInput(
            topic=topic,
            research_results=research_results,
            project_goals=project_goals,
            target_users=target_users,
            timeline=timeline
        )
        
        prp_content = await writer.write_prp_from_research(research_input)
        
        logger.info(f"PRP generated for topic: {topic} ({len(prp_content)} characters)")
        return prp_content
        
    except PRPWriterError as e:
        logger.error(f"PRP generation failed: {e}")
        return f"Error generating PRP: {e}"


@research_agent.tool
async def parse_prp_and_create_project(
    ctx: RunContext[ResearchAgentDependencies],
    prp_content: str,
    project_name: str
) -> Dict[str, Any]:
    """
    Parse PRP using MCP server and create project structure
    
    Args:
        prp_content: PRP content to parse
        project_name: Name for the project
        
    Returns:
        Project creation results
    """
    try:
        # Configure MCP client
        mcp_config = MCPClientConfig(
            server_url=ctx.deps.mcp_server_url,
            github_token=ctx.deps.github_token
        )
        
        async with MCPClient(mcp_config) as mcp_client:
            # Parse PRP using MCP server
            logger.info(f"Parsing PRP for project: {project_name}")
            parse_result = await parse_prp_via_mcp(
                mcp_client,
                prp_content,
                project_name=project_name
            )
            
            # Extract project data from parse result
            # Note: This depends on the actual response format from your MCP server
            if "content" in parse_result and parse_result["content"]:
                content_text = parse_result["content"][0].get("text", "")
                
                # Parse the response text to extract key information
                project_data = _extract_project_data_from_mcp_response(content_text)
                
                logger.info(f"Project created: {project_name} - {project_data['tasks_created']} tasks, {project_data['documentation_created']} docs")
                
                return {
                    "success": True,
                    "project_name": project_name,
                    "parse_result": parse_result,
                    **project_data
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to parse PRP - no content returned from MCP server"
                }
                
    except MCPClientError as e:
        logger.error(f"MCP client error: {e}")
        return {
            "success": False,
            "error": f"MCP client error: {e}"
        }
    except Exception as e:
        logger.error(f"Unexpected error in project creation: {e}")
        return {
            "success": False,
            "error": f"Unexpected error: {e}"
        }


@research_agent.tool
async def get_project_status(
    ctx: RunContext[ResearchAgentDependencies],
    project_name: str
) -> Dict[str, Any]:
    """
    Get current project status from MCP server
    
    Args:
        project_name: Name of the project to check
        
    Returns:
        Project status information
    """
    try:
        mcp_config = MCPClientConfig(
            server_url=ctx.deps.mcp_server_url,
            github_token=ctx.deps.github_token
        )
        
        async with MCPClient(mcp_config) as mcp_client:
            # Get tasks for the project
            tasks_result = await mcp_client.call_tool("listTasks", {"projectName": project_name})
            
            # Try to get documentation
            try:
                docs_result = await mcp_client.call_tool("listDocumentation", {"projectName": project_name})
            except:
                docs_result = {"content": [{"text": "Documentation listing not available"}]}
            
            return {
                "project_name": project_name,
                "tasks": tasks_result,
                "documentation": docs_result,
                "status": "active"
            }
            
    except MCPClientError as e:
        logger.error(f"Failed to get project status: {e}")
        return {
            "project_name": project_name,
            "error": str(e),
            "status": "error"
        }


def _extract_project_data_from_mcp_response(response_text: str) -> Dict[str, Any]:
    """
    Extract project metrics from MCP server response text
    
    Args:
        response_text: Text response from MCP server
        
    Returns:
        Extracted project data
    """
    # Parse the MCP response to extract key metrics
    # This is a simple text parsing approach - in production you might want
    # to use more sophisticated parsing or structured responses
    
    tasks_created = 0
    documentation_created = 0
    estimated_hours = 0
    
    lines = response_text.split('\n')
    for line in lines:
        if "Total Tasks Extracted:" in line:
            try:
                tasks_created = int(line.split(':')[-1].strip())
            except:
                pass
        elif "Documentation Sections:" in line:
            try:
                documentation_created = int(line.split(':')[-1].strip())
            except:
                pass
        elif "Estimated Total Hours:" in line:
            try:
                estimated_hours = int(line.split(':')[-1].strip())
            except:
                pass
    
    return {
        "tasks_created": tasks_created,
        "documentation_created": documentation_created,
        "estimated_hours": estimated_hours
    }


# Main research workflow function
async def conduct_research_and_create_project(
    request: ResearchRequest,
    dependencies: ResearchAgentDependencies
) -> ResearchResponse:
    """
    Execute complete research-to-project workflow
    
    Args:
        request: Research request parameters
        dependencies: Agent dependencies
        
    Returns:
        Complete research and project creation response
    """
    session_id = str(uuid.uuid4())
    
    try:
        # Run the research agent with the request
        result = await research_agent.run(
            f"""
            Conduct comprehensive research on "{request.topic}" and create a complete project structure.
            
            Requirements:
            - Search depth: {request.search_depth} results
            - Project goals: {request.project_goals or 'Not specified'}
            - Target users: {request.target_users or 'Not specified'}
            - Timeline: {request.timeline or 'Not specified'}
            - Focus areas: {request.focus_areas or 'General research'}
            
            Please follow the complete workflow:
            1. Research the topic thoroughly using web search
            2. Generate a comprehensive PRP based on findings
            3. Parse the PRP using MCP server to create project structure
            4. Provide status and next steps
            
            Return structured output with all metrics and recommendations.
            """,
            deps=ResearchAgentDependencies(
                **dependencies.__dict__,
                session_id=session_id
            )
        )
        
        # Convert agent result to response format
        return ResearchResponse(
            success=result.data.success,
            session_id=session_id,
            topic=request.topic,
            search_results_count=result.data.search_results_count,
            prp_generated=True,
            prp_parsed=result.data.success,
            tasks_created=result.data.tasks_created,
            documentation_created=result.data.documentation_created,
            project_name=result.data.project_name,
            estimated_hours=result.data.estimated_hours,
            next_steps=result.data.next_steps,
            error_message=result.data.error_message
        )
        
    except Exception as e:
        logger.error(f"Research workflow failed: {e}")
        return ResearchResponse(
            success=False,
            session_id=session_id,
            topic=request.topic,
            search_results_count=0,
            prp_generated=False,
            prp_parsed=False,
            error_message=str(e)
        )