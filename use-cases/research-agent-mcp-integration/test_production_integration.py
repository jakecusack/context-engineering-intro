#!/usr/bin/env python3
"""
Test Research Agent Integration with Production MCP Server

This tests the integration against your LIVE MCP server deployed via GitHub Actions,
avoiding the need for local .env files entirely.
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add src to path for imports
sys.path.append(str(Path(__file__).parent / "src"))

from tools.mcp_client import MCPClient, MCPClientConfig

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def test_production_mcp_server():
    """Test connection to production MCP server deployed via GitHub Actions"""
    
    print("🚀 Testing Research Agent Integration with Production MCP Server")
    print("=" * 70)
    
    # Your production MCP server URL (replace with your actual Cloudflare Workers URL)
    PRODUCTION_MCP_URL = "https://your-worker-name.your-subdomain.workers.dev/mcp"
    
    print(f"🌐 Testing against production server: {PRODUCTION_MCP_URL}")
    print("📡 This uses your GitHub Actions deployed MCP server with all secrets managed securely")
    
    # Configure MCP client for production
    config = MCPClientConfig(
        server_url=PRODUCTION_MCP_URL,
        timeout=30
        # No GitHub token needed for discovery - OAuth will handle auth for actual operations
    )
    
    try:
        print("\n1️⃣ Testing basic connectivity...")
        async with MCPClient(config) as client:
            # Test basic tool discovery (should work without auth)
            tools = await client.discover_tools()
            
            print(f"✅ Successfully connected to production MCP server!")
            print(f"📦 Available tools ({len(tools)}): {', '.join(tools)}")
            
            # Expected tools from your Deepify MCP server
            expected_tools = ['parsePRP', 'createTask', 'listTasks', 'createDocumentation']
            found_tools = [tool for tool in expected_tools if tool in tools]
            
            print(f"🎯 Core integration tools found: {', '.join(found_tools)}")
            
            if len(found_tools) >= 3:
                print("✅ Production MCP server is ready for Research Agent integration!")
                return True
            else:
                print("⚠️ Some expected tools not found - check MCP server deployment")
                return False
                
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Verify your MCP server is deployed and accessible")
        print("2. Check the production URL is correct")
        print("3. Ensure GitHub Actions deployment completed successfully")
        print("4. Test direct access: curl https://your-worker.workers.dev/health")
        return False


async def demo_research_workflow_architecture():
    """Demonstrate the complete workflow architecture"""
    
    print("\n🏗️ Complete Research Agent + MCP Integration Architecture")
    print("=" * 60)
    
    print("""
📋 Workflow Overview:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Research Agent (Pydantic AI)                            │
│     ├── Web Search (Brave API) ─────────────────────┐       │
│     ├── PRP Generation (Claude API) ────────────────┼─┐     │
│     └── MCP Client Tools ───────────────────────────┘ │     │
│                                                       │     │
│  2. Production MCP Server (Cloudflare Workers)       │     │
│     ├── GitHub OAuth Authentication ←────────────────┘     │
│     ├── PRP Parsing (Claude via GitHub Actions secrets)    │
│     ├── Task Management (PostgreSQL)                       │
│     ├── Documentation Storage                              │
│     └── All secrets managed via GitHub Actions! 🔐         │
│                                                             │
│  3. Result: Research → PRP → Tasks → Complete Project      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

🔑 Security Model:
├── Production: ALL secrets in GitHub Actions (✅ DONE)
├── Research Agent: Uses public APIs + MCP client
├── Authentication: GitHub OAuth (handled by MCP server)
└── No local .env files needed for production testing!

🚀 Next Steps:
1. Deploy MCP server (✅ DONE via GitHub Actions)
2. Test integration against production server
3. Run research workflows with real data
4. Scale to multiple research agents
""")


async def main():
    """Main test execution"""
    
    await demo_research_workflow_architecture()
    
    print("\n" + "="*70)
    success = await test_production_mcp_server()
    
    if success:
        print("\n🎉 Integration Test Results:")
        print("✅ Production MCP server is accessible")
        print("✅ Core tools are available for research agent")
        print("✅ Ready for full research-to-project workflows")
        print("\n📋 Ready for Next Phase:")
        print("- Add your production MCP server URL to the test")
        print("- Configure research agent to use production server")
        print("- Run end-to-end research workflows")
        print("- All secrets stay secure in GitHub Actions! 🔐")
    else:
        print("\n⚠️ Integration test incomplete - check MCP server deployment")
    
    print(f"\n💡 Key Insight: No .env files needed!")
    print(f"   Your GitHub Actions approach handles ALL production secrets securely.")


if __name__ == "__main__":
    asyncio.run(main())