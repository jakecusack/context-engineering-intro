#!/usr/bin/env python3
"""
Complete Research-to-Project Workflow Example

This script demonstrates the full integration between the Pydantic AI Research Agent
and the Deepify MCP Server to create projects from research.

Usage:
    python research_workflow.py "Research Next.js 15 and create a project plan"
    python research_workflow.py "Research FastAPI best practices for microservices"
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent / "src"))

from config.settings import settings
from agents.research_agent import conduct_research_and_create_project, ResearchAgentDependencies
from models.research_models import ResearchRequest

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main workflow execution"""
    
    # Check for command line argument
    if len(sys.argv) < 2:
        print("Usage: python research_workflow.py \"Research topic and create project\"")
        print("\nExamples:")
        print("  python research_workflow.py \"Research Next.js 15 and create a project plan\"")
        print("  python research_workflow.py \"Research FastAPI best practices for microservices\"")
        print("  python research_workflow.py \"Research Rust web frameworks and create comparison project\"")
        return
    
    research_topic = sys.argv[1]
    
    print(f"🔍 Starting research workflow for: {research_topic}")
    print("=" * 80)
    
    # Validate configuration
    try:
        if not settings.brave_api_key:
            raise ValueError("BRAVE_API_KEY not configured")
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        if not settings.mcp_server_url:
            raise ValueError("MCP_SERVER_URL not configured")
        
        print(f"✅ Configuration validated")
        print(f"   - MCP Server: {settings.mcp_server_url}")
        print(f"   - Model Provider: {settings.default_model_provider}")
        print(f"   - Max Search Results: {settings.max_search_results}")
        print()
        
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        print("Please check your .env file and ensure all required variables are set.")
        return
    
    # Create research request
    request = ResearchRequest(
        topic=research_topic,
        search_depth=settings.max_search_results,
        project_goals=[
            "Create a comprehensive understanding of the topic",
            "Identify best practices and common patterns",
            "Build a practical implementation plan"
        ],
        target_users=["developers", "technical teams"],
        timeline="2-4 weeks for initial implementation"
    )
    
    # Configure agent dependencies
    dependencies = ResearchAgentDependencies(
        brave_api_key=settings.brave_api_key,
        anthropic_api_key=settings.anthropic_api_key,
        mcp_server_url=settings.mcp_server_url,
        github_token=settings.github_token
    )
    
    try:
        print("🤖 Starting AI research agent...")
        print("This may take a few minutes to complete all steps:")
        print("  1. Web search and research")
        print("  2. PRP generation from findings")
        print("  3. MCP server integration")
        print("  4. Project structure creation")
        print()
        
        # Execute the complete workflow
        response = await conduct_research_and_create_project(request, dependencies)
        
        # Display results
        print("🎉 Research Workflow Complete!")
        print("=" * 80)
        
        if response.success:
            print(f"✅ **Project Created Successfully**")
            print(f"   - Session ID: {response.session_id}")
            print(f"   - Project Name: {response.project_name or 'Generated from topic'}")
            print(f"   - Search Results Analyzed: {response.search_results_count}")
            print(f"   - PRP Generated: {'Yes' if response.prp_generated else 'No'}")
            print(f"   - PRP Parsed by MCP: {'Yes' if response.prp_parsed else 'No'}")
            print(f"   - Tasks Created: {response.tasks_created}")
            print(f"   - Documentation Created: {response.documentation_created}")
            
            if response.estimated_hours:
                print(f"   - Estimated Project Hours: {response.estimated_hours}")
            
            print()
            print("📋 **Next Steps:**")
            for i, step in enumerate(response.next_steps, 1):
                print(f"   {i}. {step}")
            
            print()
            print("🔗 **MCP Server Access:**")
            print(f"   Your project data is now stored in the MCP server at: {settings.mcp_server_url}")
            print(f"   You can query tasks, documentation, and project status using MCP tools.")
            
        else:
            print(f"❌ **Workflow Failed**")
            print(f"   Error: {response.error_message}")
            print(f"   Session ID: {response.session_id}")
            
            if response.search_results_count > 0:
                print(f"   Note: {response.search_results_count} search results were found before failure")
        
        print()
        print("🔧 **Integration Details:**")
        print(f"   - Research Agent: Pydantic AI with {settings.default_model_provider}")
        print(f"   - MCP Server: Deepify server at {settings.mcp_server_url}")
        print(f"   - Database: PostgreSQL via MCP server")
        print(f"   - Authentication: GitHub OAuth via MCP")
        
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        print(f"❌ **Unexpected Error**: {e}")
        print("Check the logs for detailed error information.")


def print_example_usage():
    """Print usage examples"""
    print("\n📚 **Example Research Topics:**")
    print()
    print("**Web Development:**")
    print("  python research_workflow.py \"Research Next.js 15 features and create migration project\"")
    print("  python research_workflow.py \"Research React Server Components best practices\"")
    print()
    print("**Backend Development:**")
    print("  python research_workflow.py \"Research FastAPI performance optimization techniques\"")
    print("  python research_workflow.py \"Research microservices patterns with Python\"")
    print()
    print("**AI/ML:**")
    print("  python research_workflow.py \"Research LangChain vs LlamaIndex for RAG applications\"")
    print("  python research_workflow.py \"Research Pydantic AI agent deployment patterns\"")
    print()
    print("**DevOps:**")
    print("  python research_workflow.py \"Research Kubernetes monitoring with Prometheus\"")
    print("  python research_workflow.py \"Research GitHub Actions CI/CD best practices\"")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_example_usage()
    else:
        asyncio.run(main())