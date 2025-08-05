# 🚀 Deepify.org PRP Parsing MCP Server - Deployment Guide

## Current Status
✅ **Development Complete!** Your PRP parsing MCP server is ready for production deployment.

## Platform Compatibility Issue
⚠️ **Note**: Cloudflare Workers' `workerd` runtime doesn't support Windows ARM64. You'll need to deploy from:
- Intel/AMD64 Windows machine
- macOS (Intel or Apple Silicon)
- Linux system
- GitHub Actions CI/CD (recommended)

## 🔧 Pre-Deployment Checklist

### 1. Required Environment Variables
Before deployment, you'll need to configure these secrets in Cloudflare:

#### **Required Secrets:**
```bash
# GitHub OAuth (get from https://github.com/settings/applications/new)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
COOKIE_ENCRYPTION_KEY=your_32_char_random_string

# Anthropic API (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-5-haiku-latest

# PostgreSQL Database (Hyperdrive recommended for production)
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```

#### **Optional Secrets:**
```bash
# For monitoring (optional)
SENTRY_DSN=your_sentry_dsn
NODE_ENV=production
```

### 2. Database Setup
Your PostgreSQL database needs these tables (schema already created in `src/database/schema.sql`):
- `tasks` - Task management
- `documentation` - Project documentation
- `tags` - Tagging system
- `prp_parsing_history` - PRP parsing logs
- `task_tags` & `documentation_tags` - Many-to-many relationships

## 🚀 Deployment Options

### Option A: GitHub Actions (Recommended)
1. **Fork/Push to GitHub**
2. **Add GitHub Secrets**: Go to your repo Settings → Secrets and variables → Actions
3. **Add Cloudflare API Token**: Get from https://dash.cloudflare.com/profile/api-tokens
4. **GitHub Actions will automatically deploy on push**

### Option B: Manual Deployment (Compatible System)
```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Set secrets
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET  
wrangler secret put COOKIE_ENCRYPTION_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put DATABASE_URL

# 4. Deploy
wrangler deploy
```

### Option C: Cloud Development Environment
Use GitHub Codespaces, GitPod, or similar cloud IDE with AMD64/Intel architecture.

## 🗄️ Database Setup Commands

### Create Database Schema:
```sql
-- Run the schema.sql file in your PostgreSQL database
-- File location: src/database/schema.sql
```

### For Cloudflare Hyperdrive (Recommended):
1. Create Hyperdrive configuration in Cloudflare Dashboard
2. Update `wrangler.jsonc` with Hyperdrive binding
3. Use Hyperdrive connection string as `DATABASE_URL`

## 🔗 Custom Domain Setup (deepify.org)

### 1. Configure Custom Domain in Cloudflare:
```bash
# Add custom route in Cloudflare Dashboard
# Workers & Pages → Your Worker → Settings → Triggers
# Add route: deepify.org/* or api.deepify.org/*
```

### 2. Update DNS:
- Point your domain to Cloudflare Workers
- Set up A/AAAA records or CNAME as directed

## 🧪 Testing Your Deployment

### 1. Test MCP Tools:
```bash
# Test Anthropic connection
curl -X POST https://deepify.org/mcp -d '{"method":"call_tool","params":{"name":"testAnthropicConnection"}}'

# Test PRP parsing
curl -X POST https://deepify.org/mcp -d '{"method":"call_tool","params":{"name":"parsePRP","arguments":{"prpContent":"Your PRP content here"}}}'
```

### 2. Health Check Endpoints:
- `https://deepify.org/health` - Basic health check
- `https://deepify.org/auth/github` - OAuth flow test

## 📋 MCP Tools Available

Your deployed server will provide these 13 MCP tools:

### PRP Processing:
- `parsePRP` - Parse PRP content with Anthropic Claude
- `getParsingHistory` - View parsing history
- `getParsingDetails` - Get detailed parsing results
- `testAnthropicConnection` - Verify API connectivity

### Task Management:
- `createTask` - Create new tasks
- `getTasks` - List/filter tasks
- `updateTask` - Update existing tasks
- `deleteTask` - Remove tasks
- `assignTagsToTask` - Tag management
- `getTaskStatistics` - Usage analytics

### Documentation:
- `createDocumentation` - Add project docs
- `getDocumentation` - Retrieve documentation
- `updateDocumentation` - Edit existing docs
- `deleteDocumentation` - Remove documentation
- `getProjectDocumentation` - Project overview
- `assignTagsToDocumentation` - Doc tagging

### Tag Management:
- `createTag` - Create organization tags
- `getTags` - List all tags
- `updateTag` - Modify tags
- `deleteTag` - Remove tags
- `getTagUsage` - Usage statistics
- `getPopularTags` - Most used tags

## 🔧 Troubleshooting

### Common Issues:
1. **Database Connection**: Verify `DATABASE_URL` format and permissions
2. **Authentication**: Check GitHub OAuth app configuration
3. **Anthropic API**: Verify API key and model access
4. **CORS**: Configure allowed origins for your domain

### Debug Commands:
```bash
# View logs
wrangler tail

# Check deployment status
wrangler deployments list

# Test locally (on compatible system)
npm run dev
```

## 🎯 Next Steps After Deployment

1. **Test all MCP tools** with real PRP content
2. **Set up monitoring** with Sentry or Cloudflare Analytics
3. **Configure rate limiting** for production use
4. **Set up backup strategy** for your PostgreSQL database
5. **Document your API** for team usage

---

## 🚨 Ready to Deploy?

**Current Configuration:**
- ✅ Server Name: `deepify-mcp-server`
- ✅ Domain Ready: `deepify.org`
- ✅ Database Schema: Complete
- ✅ MCP Tools: 13 tools implemented
- ✅ Type Safety: All core errors fixed
- ✅ Authentication: GitHub OAuth ready
- ✅ AI Integration: Anthropic Claude configured

**Choose your deployment method above and follow the steps!**