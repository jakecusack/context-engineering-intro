#!/usr/bin/env python3
"""
Direct MCP Client Testing Example

This script tests the MCP client tools directly without the research agent,
useful for debugging and understanding the MCP integration.

Usage:
    python direct_mcp_client.py
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent / "src"))

from config.settings import settings
from tools.mcp_client import (
    MCPClient, MCPClientConfig,
    parse_prp_via_mcp, create_task_via_mcp, create_documentation_via_mcp,
    list_tasks_via_mcp, get_project_status_via_mcp
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Sample PRP for testing
SAMPLE_PRP = """
# FastAPI Microservices Project

## Project Overview
Build a high-performance microservices architecture using FastAPI with proper authentication, 
database integration, and deployment automation.

## Goals
- Create a scalable microservices foundation
- Implement JWT authentication with role-based access
- Set up PostgreSQL database with migrations
- Configure Docker containerization
- Deploy to Kubernetes with monitoring

## Target Users
- Backend developers
- DevOps engineers
- Technical leads

## Core Features

### Must-Have Features
1. **User Authentication Service**
   - JWT token generation and validation
   - Role-based access control (RBAC)
   - Password hashing and security
   - Estimated time: 16 hours

2. **API Gateway**
   - Request routing and load balancing
   - Rate limiting and throttling
   - Request/response logging
   - Estimated time: 12 hours

3. **Database Service**
   - PostgreSQL integration
   - Database migrations with Alembic
   - Connection pooling
   - Estimated time: 8 hours

### Should-Have Features
4. **Monitoring and Logging**
   - Prometheus metrics integration
   - Structured logging with JSON
   - Health check endpoints
   - Estimated time: 10 hours

5. **CI/CD Pipeline**
   - GitHub Actions workflow
   - Automated testing and deployment
   - Docker image building
   - Estimated time: 14 hours

## Technical Requirements
- Python 3.11+
- FastAPI framework
- PostgreSQL database
- Docker and Kubernetes
- GitHub Actions for CI/CD

## Success Criteria
- All services can be deployed independently
- Authentication works across all services
- API response times under 100ms
- 99.9% uptime in production

## Timeline
- Week 1: Authentication service and database setup
- Week 2: API gateway and core integrations
- Week 3: Monitoring and logging implementation
- Week 4: CI/CD pipeline and deployment automation

## Constraints
- Must use Python ecosystem
- Database must be PostgreSQL
- Deployment target is Kubernetes
- Budget limit: $500/month for infrastructure
"""


async def test_mcp_client():
    """Test MCP client functionality"""
    
    print("🔧 Testing MCP Client Integration")
    print("=" * 50)
    
    # Configure MCP client
    config = MCPClientConfig(
        server_url=settings.mcp_server_url,
        github_token=settings.github_token,
        timeout=30
    )
    
    print(f"📡 Connecting to MCP server: {config.server_url}")
    
    try:
        async with MCPClient(config) as client:
            # Test 1: Discover available tools
            print("\n1️⃣ Discovering available tools...")
            tools = await client.discover_tools()
            print(f"   Found {len(tools)} tools: {', '.join(tools)}")
            
            # Test 2: Parse sample PRP
            print("\n2️⃣ Testing PRP parsing...")
            project_name = "fastapi-microservices-test"
            
            try:
                parse_result = await parse_prp_via_mcp(
                    client,
                    SAMPLE_PRP,
                    project_name=project_name
                )
                
                print(f"   ✅ PRP parsed successfully")
                if "content" in parse_result:
                    content = parse_result["content"][0]["text"]
                    # Extract key metrics from response
                    lines = content.split('\n')
                    for line in lines[:10]:  # Show first 10 lines
                        if line.strip():
                            print(f"      {line.strip()}")
                    if len(lines) > 10:
                        print(f"      ... ({len(lines)-10} more lines)")
                
            except Exception as e:
                print(f"   ❌ PRP parsing failed: {e}")
            
            # Test 3: Create a sample task manually
            print("\n3️⃣ Testing task creation...")
            
            try:
                task_result = await create_task_via_mcp(
                    client,
                    title="Test MCP Integration",
                    description="Verify that MCP client can create tasks successfully",
                    project_name=project_name,
                    priority="high",
                    estimated_hours=2,
                    tags=["testing", "integration", "mcp"]
                )
                
                print(f"   ✅ Task created successfully")
                if "content" in task_result:
                    print(f"      Response: {task_result['content'][0]['text'][:100]}...")
                
            except Exception as e:
                print(f"   ❌ Task creation failed: {e}")
            
            # Test 4: List tasks for the project
            print("\n4️⃣ Testing task listing...")
            
            try:
                tasks_result = await list_tasks_via_mcp(
                    client,
                    project_name=project_name,
                    limit=10
                )
                
                print(f"   ✅ Tasks listed successfully")
                if "content" in tasks_result:
                    print(f"      Response: {tasks_result['content'][0]['text'][:100]}...")
                
            except Exception as e:
                print(f"   ❌ Task listing failed: {e}")
            
            # Test 5: Create sample documentation
            print("\n5️⃣ Testing documentation creation...")
            
            try:
                doc_result = await create_documentation_via_mcp(
                    client,
                    title="MCP Integration Guide",
                    content="This documentation was created via MCP client to test the integration.",
                    doc_type="guide",
                    project_name=project_name,
                    importance="medium",
                    tags=["integration", "testing"]
                )
                
                print(f"   ✅ Documentation created successfully")
                if "content" in doc_result:
                    print(f"      Response: {doc_result['content'][0]['text'][:100]}...")
                
            except Exception as e:
                print(f"   ❌ Documentation creation failed: {e}")
            
            # Test 6: Get project status
            print("\n6️⃣ Testing project status retrieval...")
            
            try:
                status_result = await get_project_status_via_mcp(client, project_name)
                
                print(f"   ✅ Project status retrieved")
                print(f"      Project: {status_result.get('project_name', 'Unknown')}")
                print(f"      Status: {status_result.get('status', 'Unknown')}")
                
                if "tasks" in status_result and "content" in status_result["tasks"]:
                    print(f"      Tasks data available: Yes")
                
            except Exception as e:
                print(f"   ❌ Project status retrieval failed: {e}")
        
        print("\n🎉 MCP Client Testing Complete!")
        print("\n💡 Next Steps:")
        print("   - Check your MCP server database for the created data")
        print("   - Use the research agent workflow for end-to-end testing")
        print("   - Verify authentication is working correctly")
        
    except Exception as e:
        logger.error(f"MCP client testing failed: {e}")
        print(f"\n❌ MCP Client Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Ensure your MCP server is running (wrangler dev)")
        print("   2. Check MCP_SERVER_URL in your .env file")
        print("   3. Verify GitHub authentication token")
        print("   4. Check network connectivity to MCP server")


async def test_tool_discovery():
    """Test just the tool discovery to verify basic connection"""
    
    print("🔍 Quick Connection Test")
    print("=" * 30)
    
    config = MCPClientConfig(
        server_url=settings.mcp_server_url,
        github_token=settings.github_token
    )
    
    try:
        async with MCPClient(config) as client:
            tools = await client.discover_tools()
            print(f"✅ Connected to MCP server")
            print(f"📦 Available tools ({len(tools)}):")
            for tool in tools:
                print(f"   - {tool}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


async def main():
    """Main test execution"""
    
    # Validate configuration
    if not settings.mcp_server_url:
        print("❌ MCP_SERVER_URL not configured")
        print("Please set MCP_SERVER_URL in your .env file")
        return
    
    print("🚀 MCP Client Direct Testing")
    print("This script tests the MCP integration without the research agent.")
    print()
    
    # Quick connection test first
    connected = await test_tool_discovery()
    
    if not connected:
        print("\n🔧 Setup Instructions:")
        print("1. Start your MCP server: cd ../mcp-server/deepify-mcp-server && wrangler dev")
        print("2. Configure .env file with MCP_SERVER_URL and GITHUB_TOKEN")
        print("3. Ensure GitHub OAuth is set up correctly")
        return
    
    print()
    
    # Full test suite
    await test_mcp_client()


if __name__ == "__main__":
    asyncio.run(main())