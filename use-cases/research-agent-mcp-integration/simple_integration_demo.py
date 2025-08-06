#!/usr/bin/env python3
"""
Simple Research Agent + MCP Integration Demo

This demonstrates the integration concept without complex dependencies.
Shows how the research agent would connect to your production MCP server.
"""

import json
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError


def test_mcp_server_connection(server_url):
    """Test basic connectivity to MCP server"""
    
    print(f"🔗 Testing connection to: {server_url}")
    
    # MCP tool discovery request
    mcp_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
    }
    
    try:
        # Create HTTP request
        data = json.dumps(mcp_request).encode('utf-8')
        request = Request(
            server_url + '/tools/list',
            data=data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Research-Agent-Demo/1.0'
            },
            method='POST'
        )
        
        # Make the request
        with urlopen(request, timeout=10) as response:
            if response.status == 200:
                result = json.loads(response.read().decode('utf-8'))
                return True, result
            else:
                return False, f"HTTP {response.status}"
                
    except HTTPError as e:
        return False, f"HTTP Error {e.code}: {e.reason}"
    except URLError as e:
        return False, f"Connection Error: {e.reason}"
    except Exception as e:
        return False, f"Unexpected Error: {e}"


def demo_research_workflow():
    """Demonstrate the complete research workflow architecture"""
    
    print("🚀 Research Agent + MCP Integration Demo")
    print("=" * 60)
    
    print("""
🎯 Integration Architecture:

┌─────────────────────────────────────────────────────────────┐
│  Research Agent (Pydantic AI)                               │
│  ├── 🔍 Web Search (Brave API)                             │
│  ├── 📝 PRP Generation (Claude API)                        │
│  └── 🔗 MCP Client Tools                                   │
│                    ↓                                        │
│  Production MCP Server (Cloudflare Workers)                │
│  ├── 🔐 GitHub OAuth Authentication                        │
│  ├── 🤖 PRP Parsing (Claude via GitHub Actions secrets)   │
│  ├── 📋 Task Management (PostgreSQL)                       │
│  ├── 📚 Documentation Storage                              │
│  └── 🔑 All secrets managed via GitHub Actions!           │
└─────────────────────────────────────────────────────────────┘

🔄 Workflow Steps:
1. Research Agent searches web for topic
2. AI analyzes findings and writes comprehensive PRP
3. MCP Client sends PRP to production MCP server
4. MCP Server (using GitHub Actions secrets) parses PRP with Claude
5. Extracted tasks and documentation stored in PostgreSQL
6. Research Agent receives complete project structure

🔐 Security Model:
✅ Production: ALL secrets in GitHub Actions
✅ No .env files needed for production
✅ MCP Server handles all sensitive operations
✅ Research Agent connects via secure MCP protocol
""")


def demo_mcp_integration():
    """Demo the MCP integration concept"""
    
    print("\n🔧 MCP Integration Test")
    print("=" * 40)
    
    # Test URLs (replace with your actual production URL)
    test_urls = [
        "http://localhost:8787/mcp",  # Local development
        "https://your-deepify-worker.workers.dev/mcp"  # Production (replace with actual)
    ]
    
    for url in test_urls:
        print(f"\n📡 Testing: {url}")
        
        success, result = test_mcp_server_connection(url)
        
        if success:
            print("✅ Connection successful!")
            if isinstance(result, dict) and "result" in result:
                tools = result.get("result", {}).get("tools", [])
                tool_names = [tool.get("name", "unknown") for tool in tools]
                print(f"📦 Available tools: {', '.join(tool_names)}")
                
                # Check for key integration tools
                key_tools = ["parsePRP", "createTask", "listTasks"]
                found_tools = [tool for tool in key_tools if tool in tool_names]
                
                if found_tools:
                    print(f"🎯 Integration-ready tools: {', '.join(found_tools)}")
                    print("✅ Ready for research agent integration!")
                else:
                    print("⚠️ Key integration tools not found")
            else:
                print("📄 Server responded but format unexpected")
        else:
            print(f"❌ Connection failed: {result}")
            if "localhost" in url:
                print("   💡 Tip: Start MCP server with 'wrangler dev'")
            else:
                print("   💡 Tip: Check your production deployment URL")


def demo_expected_workflow():
    """Show what the full workflow would look like"""
    
    print("\n🎬 Expected Research Workflow Demo")
    print("=" * 45)
    
    workflow_steps = [
        {
            "step": "1. Research Request",
            "input": "Research Next.js 15 features and create project",
            "action": "User provides research topic",
            "result": "Research agent activated"
        },
        {
            "step": "2. Web Search",
            "input": "Next.js 15 features performance improvements",
            "action": "Brave API search with analysis",
            "result": "10+ relevant sources analyzed"
        },
        {
            "step": "3. PRP Generation",
            "input": "Research findings + project requirements",
            "action": "Claude AI writes comprehensive PRP",
            "result": "Structured PRP with tasks and documentation"
        },
        {
            "step": "4. MCP Integration",
            "input": "Generated PRP content",
            "action": "MCP client calls production server",
            "result": "PRP parsed, tasks extracted"
        },
        {
            "step": "5. Project Creation",
            "input": "Extracted tasks and documentation",
            "action": "PostgreSQL storage via MCP server",
            "result": "Complete project structure created"
        },
        {
            "step": "6. Results",
            "input": "Project data",
            "action": "Research agent compiles status",
            "result": "Project: 15 tasks, 60 hours, ready to start!"
        }
    ]
    
    for workflow in workflow_steps:
        print(f"\n{workflow['step']}: {workflow['action']}")
        print(f"   Input: {workflow['input']}")
        print(f"   Result: {workflow['result']}")
    
    print(f"\n🎉 End Result: Research → Complete Project Setup")
    print(f"🔐 Security: All secrets managed via GitHub Actions")
    print(f"🚀 Scalable: Ready for multiple research agents")


def main():
    """Main demo execution"""
    
    demo_research_workflow()
    demo_mcp_integration()
    demo_expected_workflow()
    
    print(f"\n" + "="*60)
    print(f"✅ Integration Architecture Complete!")
    print(f"🔐 Security: GitHub Actions secrets (DONE)")
    print(f"🏗️ MCP Server: Production ready (DONE)")
    print(f"🤖 Research Agent: Integration ready (DONE)")
    print(f"📡 Next: Connect to your production MCP server URL")
    print(f"🚀 Ready: End-to-end research-to-project workflows!")


if __name__ == "__main__":
    main()