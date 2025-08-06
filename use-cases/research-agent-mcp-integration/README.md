# Research Agent + MCP Integration

A powerful **Pydantic AI Research Agent** that integrates with the **Deepify MCP Server** to create an end-to-end "AI Research → Project Management" workflow.

## 🎯 What This Does

This integration demonstrates how to:

1. **Research Agent** conducts web research on any topic
2. **AI Agent** writes Product Requirements Prompts (PRPs) based on research findings  
3. **MCP Client** connects to your Deepify MCP Server to:
   - Parse PRPs using Claude AI
   - Extract structured tasks and documentation
   - Store everything in PostgreSQL database
4. **Agent** provides complete project setup and next steps

## 🚀 Complete Workflow Example

```bash
# Input: "Research Next.js 15 and create a project plan"

# Agent automatically:
# 1. Searches web for "Next.js 15 features performance improvements"
# 2. Writes comprehensive PRP based on research
# 3. Calls MCP server to parse PRP → extract tasks
# 4. Creates project structure in database  
# 5. Returns: "Project created with 12 tasks, estimated 40 hours"
```

## 🏗️ Architecture

```
Pydantic AI Research Agent
    ↓ (uses tools)
    ├── Web Search Tool (Brave API)
    ├── PRP Writing Tool (local AI)  
    └── MCP Client Tools
        ↓ (HTTP/SSE to MCP server)
        └── Deepify MCP Server
            ├── PRP Parser (Claude)
            ├── Task Management  
            ├── Documentation Storage
            └── PostgreSQL Database
```

## 📁 Project Structure

```
research-agent-mcp-integration/
├── README.md                     # This file
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment template
├── src/
│   ├── agents/
│   │   ├── research_agent.py     # Main research agent
│   │   └── project_agent.py      # Project management agent
│   ├── tools/
│   │   ├── web_search.py         # Brave search integration
│   │   ├── mcp_client.py         # MCP client tools
│   │   └── prp_writer.py         # PRP generation tool
│   ├── models/
│   │   ├── research_models.py    # Pydantic models for research
│   │   └── project_models.py     # Pydantic models for projects
│   └── config/
│       ├── settings.py           # Configuration management
│       └── providers.py          # LLM provider setup
├── examples/
│   ├── research_workflow.py      # End-to-end example
│   └── direct_mcp_client.py      # Direct MCP testing
└── tests/
    ├── test_research_agent.py    # Agent behavior tests
    ├── test_mcp_integration.py   # MCP client tests
    └── fixtures/                 # Test data
```

## 🛠️ Prerequisites

1. **Running Deepify MCP Server** (your existing project)
2. **Brave Search API key** (for web research)
3. **Anthropic API key** (for local PRP writing)
4. **GitHub OAuth token** (for MCP server authentication)

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start your MCP server
cd ../mcp-server/deepify-mcp-server
wrangler dev  # Available at http://localhost:8787/mcp

# 4. Run the research agent
cd ../../research-agent-mcp-integration
python examples/research_workflow.py "Research FastAPI best practices and create project plan"
```

## 🎯 Key Integration Points

### **MCP Client Tools**
- `parse_prp_via_mcp()` - Calls MCP server's `parsePRP` tool
- `create_tasks_via_mcp()` - Calls MCP server's `createTask` tool  
- `get_project_status_via_mcp()` - Queries project data via MCP

### **Research Agent Tools**
- `search_web()` - Brave search with result analysis
- `write_prp()` - Generate PRP from research findings
- `manage_project()` - Full project lifecycle via MCP

### **Workflow Orchestration**  
- Research → PRP → Parse → Tasks → Documentation → Status

## 🔧 Configuration

### Environment Variables
```bash
# Research capabilities
BRAVE_API_KEY=your_brave_search_key
ANTHROPIC_API_KEY=your_anthropic_key

# MCP server connection
MCP_SERVER_URL=http://localhost:8787/mcp
GITHUB_TOKEN=your_github_token  # For MCP authentication

# Optional: Model providers
OPENAI_API_KEY=your_openai_key
```

### MCP Server Connection
```python
# Automatic discovery of your MCP server tools
mcp_client = MCPClient("http://localhost:8787/mcp")
available_tools = await mcp_client.discover_tools()
# Returns: ['parsePRP', 'createTask', 'listTasks', 'createDocumentation', ...]
```

## 📊 Success Metrics

After integration, you'll have:

✅ **End-to-end automation**: Research topic → Complete project setup  
✅ **Intelligent task extraction**: AI identifies realistic tasks from research  
✅ **Structured project data**: All stored in your existing PostgreSQL schema  
✅ **Scalable pattern**: Template for any Research → Project workflow  
✅ **Multi-agent foundation**: Ready for agent teams and complex workflows

## 🔄 Next Steps After This Integration

1. **Multi-Agent Teams** - Research Agent + Planning Agent + Execution Agent
2. **Real-time Collaboration** - Multiple agents working on same project  
3. **Advanced Workflows** - Competitive analysis, market research, technical research
4. **Integration Templates** - Apply this pattern to other MCP servers

---

**This integration proves the power of combining AI agents with MCP servers - turning research into actionable, structured project plans automatically!**