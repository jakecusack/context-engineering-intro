---
name: "Deepify PRP Parser MCP Server"
description: Production-ready MCP server for parsing Product Requirements Prompts (PRPs) using Anthropic AI and managing tasks/documentation with PostgreSQL database integration, deployed to deepify.org
---

## Purpose

Create a production-ready Model Context Protocol (MCP) server for deepify.org that parses Product Requirements Prompts (PRPs) using Anthropic's Claude API, extracts tasks and documentation, and provides comprehensive CRUD operations for task management and documentation storage.

## Core Principles

1. **Context is King**: Include ALL necessary MCP patterns, PRP parsing logic, and database schemas
2. **Validation Loops**: Provide executable tests from TypeScript compilation to production deployment
3. **Security First**: Build-in authentication, authorization, and SQL injection protection
4. **AI-Powered**: Use Anthropic Claude API for intelligent PRP parsing and task extraction

---

## Goal

Build a production-ready MCP (Model Context Protocol) server with:

- **PRP Parsing Engine**: Use Anthropic Claude API to intelligently parse PRPs and extract tasks, goals, documentation
- **Task Management CRUD**: Complete create, read, update, delete operations for tasks and associated metadata
- **Documentation Management**: Store and manage PRP-derived documentation, goals, target users, and project context
- **GitHub OAuth authentication** with role-based access control
- **Cloudflare Workers deployment** to deepify.org with monitoring
- **PostgreSQL database** with proper schema for tasks, documentation, and tags

## Why

- **Developer Productivity**: Enable AI assistants to efficiently parse PRPs and extract actionable tasks
- **Project Management**: Centralized task and documentation management derived from PRPs
- **Enterprise Security**: GitHub OAuth with granular permission system
- **Scalability**: Cloudflare Workers global edge deployment at deepify.org
- **Integration**: Bridge between PRP methodology and task management systems
- **User Value**: Automated extraction of structured project data from narrative PRPs

## What

### MCP Server Features

**Core MCP Tools:**

- Tools are organized in modular files and registered via `src/tools/register-tools.ts`
- Each feature/domain gets its own tool registration file (e.g., `prp-tools.ts`, `task-tools.ts`, `documentation-tools.ts`)
- **parsePRP**: Parse PRP content using Anthropic Claude API to extract tasks, goals, and documentation
- **createTask**: Create new task from PRP-extracted data or manual input
- **getTasks**: Retrieve tasks with filtering by project, status, tags
- **updateTask**: Modify task details, status, or associated documentation
- **deleteTask**: Remove tasks from the system
- **getDocumentation**: Retrieve documentation associated with tasks or projects
- **updateDocumentation**: Modify project documentation and context
- **manageTags**: Create, read, update, delete tags for task organization
- User authentication and permission validation happens during tool registration
- Comprehensive error handling and logging for PRP parsing operations

**Authentication & Authorization:**

- GitHub OAuth 2.0 integration with signed cookie approval system
- Role-based access control (read-only vs privileged users)
- User context propagation to all MCP tools
- Secure session management with HMAC-signed cookies

**Database Integration:**

- PostgreSQL with custom schema for PRPs, tasks, documentation, and tags
- SQL injection protection and query validation
- Read/write operation separation based on user permissions
- Error sanitization to prevent information leakage

**AI Integration:**

- Anthropic Claude API integration for PRP parsing
- Environment-based configuration for API key and model selection
- Structured prompts for extracting tasks, goals, and documentation from PRPs
- Error handling for API failures and rate limiting

**Deployment & Monitoring:**

- Cloudflare Workers with Durable Objects for state management
- Optional Sentry integration for error tracking and performance monitoring
- Environment-based configuration (development vs production)
- Real-time logging and alerting for PRP parsing operations

### Success Criteria

- [ ] MCP server passes validation with MCP Inspector
- [ ] GitHub OAuth flow works end-to-end (authorization → callback → MCP access)
- [ ] TypeScript compilation succeeds with no errors
- [ ] Local development server starts and responds correctly
- [ ] Production deployment to deepify.org (Cloudflare Workers) succeeds
- [ ] Authentication prevents unauthorized access to sensitive operations
- [ ] PRP parsing using Anthropic API works reliably and extracts structured data
- [ ] Database schema supports all PRP-derived data (tasks, documentation, tags)
- [ ] All CRUD operations work for tasks, documentation, and tags
- [ ] Error handling provides user-friendly messages without leaking system details

## All Needed Context

### Documentation & References (MUST READ)

```yaml
# CRITICAL MCP PATTERNS - Read these first
- docfile: PRPs/ai_docs/mcp_patterns.md
  why: Core MCP development patterns, security practices, and error handling

# CRITICAL ANTHROPIC API USAGE - Essential for PRP parsing
- docfile: PRPs/ai_docs/claude_api_usage.md
  why: How to use the Anthropic API to get a response from an LLM for PRP parsing

# TOOL REGISTRATION SYSTEM - Understand the modular approach
- file: src/tools/register-tools.ts
  why: Central registry showing how all tools are imported and registered - STUDY this pattern

# EXAMPLE MCP TOOLS - Look here how to create and register new tools
- file: examples/database-tools.ts
  why: Example tools for a Postgres MCP server showing best practices for tool creation and registration

- file: examples/database-tools-sentry.ts
  why: Example tools for the Postgres MCP server but with the Sentry integration for production monitoring

# EXISTING CODEBASE PATTERNS - Study these implementations
- file: src/index.ts
  why: Complete MCP server with authentication, database, and tools - MIRROR this pattern

- file: src/auth/github-handler.ts
  why: OAuth flow implementation - USE this exact pattern for authentication

- file: src/database/connection.ts
  why: Database connection and pooling patterns
  
- file: src/database/security.ts
  why: Database security, SQL validation - FOLLOW these patterns

- file: src/database/utils.ts
  why: Database utility functions and connection management

- file: wrangler.jsonc
  why: Cloudflare Workers configuration - COPY this pattern for deployment

# OFFICIAL MCP DOCUMENTATION
- url: https://modelcontextprotocol.io/docs/concepts/tools
  why: MCP tool registration and schema definition patterns

- url: https://modelcontextprotocol.io/docs/concepts/resources
  why: MCP resource implementation if needed

# ANTHROPIC API DOCUMENTATION
- url: https://docs.anthropic.com/en/api/messages
  why: Understanding Claude API for PRP parsing functionality
```

### Current Codebase Tree

```bash
deepify-mcp-server/
├── src/
│   ├── index.ts                 # Main authenticated MCP server ← STUDY THIS
│   ├── index_sentry.ts         # Sentry monitoring version
│   ├── types.ts                # TypeScript interfaces and types
│   ├── auth/
│   │   ├── github-handler.ts   # OAuth implementation ← USE THIS PATTERN
│   │   └── oauth-utils.ts      # OAuth utility functions
│   ├── database/
│   │   ├── connection.ts       # Database connection management
│   │   ├── security.ts         # SQL validation and security ← SECURITY PATTERNS
│   │   └── utils.ts            # Database utilities and helpers
│   └── tools/                  # Tool registration system
│       └── register-tools.ts   # Central tool registry ← UNDERSTAND THIS
├── PRPs/
│   ├── templates/prp_mcp_base.md  # This template
│   ├── ai_docs/                   # Implementation guides ← READ ALL
│   │   ├── mcp_patterns.md        # Core MCP patterns
│   │   └── claude_api_usage.md    # Anthropic API integration
│   └── INITIAL.md              # Original requirements
├── examples/                   # Example tool implementations
│   ├── database-tools.ts       # Database tools example ← FOLLOW PATTERN
│   └── database-tools-sentry.ts # With Sentry monitoring
├── wrangler.jsonc              # Cloudflare config ← COPY PATTERNS
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── .dev.vars                   # Development environment variables
```

### Desired Codebase Tree (Files to add/modify)

```bash
src/
├── tools/
│   ├── prp-parser-tools.ts     # PRP parsing and extraction tools
│   ├── task-management-tools.ts # Task CRUD operations
│   ├── documentation-tools.ts  # Documentation management tools
│   └── tag-management-tools.ts # Tag CRUD operations
├── services/
│   ├── anthropic-client.ts     # Anthropic API client service
│   └── prp-parser.ts          # PRP parsing logic and prompts
├── database/
│   ├── schema.sql             # Database schema for tasks, documentation, tags
│   └── migrations/            # Database migration scripts
└── types/
    ├── prp-types.ts          # PRP-specific TypeScript interfaces
    ├── task-types.ts         # Task management types
    └── api-types.ts          # API response and request types
```

### Database Schema Design

```sql
-- Tasks table for storing extracted and manual tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    project_name VARCHAR(255),
    prp_source VARCHAR(255), -- Reference to source PRP
    assigned_to VARCHAR(255), -- GitHub username
    created_by VARCHAR(255) NOT NULL, -- GitHub username
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    completion_date TIMESTAMP
);

-- Documentation table for storing PRP-derived project context
CREATE TABLE documentation (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL, -- 'goals', 'why', 'target_users', 'context'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    prp_source VARCHAR(255), -- Reference to source PRP
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table for task and documentation organization
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7), -- Hex color code
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task-tag relationship table
CREATE TABLE task_tags (
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- Documentation-tag relationship table
CREATE TABLE documentation_tags (
    documentation_id INTEGER REFERENCES documentation(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (documentation_id, tag_id)
);

-- PRP parsing history for tracking and auditing
CREATE TABLE prp_parsing_history (
    id SERIAL PRIMARY KEY,
    prp_content TEXT NOT NULL,
    extracted_data JSONB, -- Structured data extracted by Claude
    parsing_model VARCHAR(100), -- Claude model used
    parsing_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parsed_by VARCHAR(255) NOT NULL, -- GitHub username
    status VARCHAR(50) DEFAULT 'success' -- 'success', 'error', 'partial'
);
```

### Known Gotchas & Critical Patterns

```typescript
// CRITICAL: Cloudflare Workers require specific patterns
// 1. ALWAYS implement cleanup for Durable Objects
export class DeepifyMCP extends McpAgent<Env, Record<string, never>, Props> {
  async cleanup(): Promise<void> {
    await closeDb(); // CRITICAL: Close database connections
  }

  async alarm(): Promise<void> {
    await this.cleanup(); // CRITICAL: Handle Durable Object alarms
  }
}

// 2. ALWAYS validate SQL to prevent injection
const validation = validateSqlQuery(sql);
if (!validation.isValid) {
  return createErrorResponse(validation.error);
}

// 3. ALWAYS check permissions before sensitive operations
const ALLOWED_USERNAMES = new Set(["admin1", "admin2"]);
if (!ALLOWED_USERNAMES.has(this.props.login)) {
  return createErrorResponse("Insufficient permissions");
}

// 4. ALWAYS use withDatabase wrapper for connection management
return await withDatabase(this.env.DATABASE_URL, async (db) => {
  // Database operations here
});

// 5. ANTHROPIC API INTEGRATION PATTERN
async function parsePRPWithClaude(prpContent: string, apiKey: string, model: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: buildPRPParsingPrompt(prpContent)
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return JSON.parse(result.content[0].text);
}

// 6. Environment interface with Anthropic API variables
interface Env {
  DATABASE_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  OAUTH_KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  MCP_OBJECT: DurableObjectNamespace;
}
```

## Implementation Blueprint

### Data Models & Types

Define TypeScript interfaces and Zod schemas for type safety and validation.

```typescript
// PRP parsing types
interface PRPParsingResult {
  tasks: ExtractedTask[];
  documentation: ExtractedDocumentation[];
  projectContext: ProjectContext;
  metadata: PRPMetadata;
}

interface ExtractedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  dependencies?: string[];
  tags?: string[];
}

interface ExtractedDocumentation {
  type: 'goals' | 'why' | 'target_users' | 'context' | 'requirements';
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
}

interface ProjectContext {
  projectName: string;
  description: string;
  targetUsers: string[];
  goals: string[];
  constraints: string[];
}

// Zod schemas for validation
const ParsePRPSchema = z.object({
  prpContent: z.string().min(10, "PRP content must be at least 10 characters"),
  projectName: z.string().min(1, "Project name is required").optional(),
});

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  projectName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedTo: z.string().optional(),
});
```

### List of Tasks (Complete in order)

```yaml
Task 1 - Environment Setup:
  UPDATE wrangler.jsonc configuration:
    - VERIFY name is "deepify-mcp-server"
    - VERIFY Durable Object class is "DeepifyMCP"
    - ADD custom route for deepify.org domain if needed
    - KEEP existing OAuth and database configuration

  UPDATE .dev.vars with Anthropic integration:
    - VERIFY GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set
    - VERIFY DATABASE_URL is configured for PostgreSQL
    - VERIFY COOKIE_ENCRYPTION_KEY is set
    - ADD ANTHROPIC_API_KEY=your_anthropic_api_key
    - ADD ANTHROPIC_MODEL=claude-3-5-haiku-latest

Task 2 - Database Schema Implementation:
  CREATE database schema file:
    - CREATE src/database/schema.sql with complete schema design
    - INCLUDE tasks, documentation, tags, and relationship tables
    - INCLUDE prp_parsing_history for audit trail
    - ADD proper indexes for performance

  RUN database migrations:
    - EXECUTE schema.sql against your PostgreSQL database
    - VERIFY all tables are created successfully
    - TEST database connection with existing patterns

Task 3 - Anthropic API Client Service:
  CREATE src/services/anthropic-client.ts:
    - IMPLEMENT AnthropicClient class with proper error handling
    - INCLUDE rate limiting and retry logic
    - USE environment variables for API key and model
    - FOLLOW patterns from PRPs/ai_docs/claude_api_usage.md

  CREATE src/services/prp-parser.ts:
    - IMPLEMENT PRP parsing prompts and logic
    - CREATE structured prompts for task extraction
    - INCLUDE documentation extraction prompts
    - ADD project context extraction logic
    - IMPLEMENT proper JSON parsing and validation

Task 4 - PRP Processing Tools:
  CREATE src/tools/prp-parser-tools.ts:
    - IMPLEMENT parsePRP tool for processing PRP content
    - USE AnthropicClient service for API calls
    - STORE parsing results in prp_parsing_history table
    - INCLUDE comprehensive error handling for API failures
    - ADD input validation with Zod schemas

  REGISTER PRP tools in src/tools/register-tools.ts:
    - IMPORT and register PRP parsing functions
    - ENSURE proper permission checking
    - INCLUDE user context in tool registration

Task 5 - Task Management Tools:
  CREATE src/tools/task-management-tools.ts:
    - IMPLEMENT createTask tool with database insertion
    - IMPLEMENT getTasks tool with filtering and pagination
    - IMPLEMENT updateTask tool with proper validation
    - IMPLEMENT deleteTask tool with permission checking
    - USE existing database security patterns
    - INCLUDE tag association management

  TEST task management functionality:
    - VERIFY all CRUD operations work correctly
    - TEST permission enforcement
    - VALIDATE input schemas and error handling

Task 6 - Documentation Management Tools:
  CREATE src/tools/documentation-tools.ts:
    - IMPLEMENT createDocumentation tool for project docs
    - IMPLEMENT getDocumentation tool with filtering
    - IMPLEMENT updateDocumentation tool with validation
    - IMPLEMENT deleteDocumentation tool with permissions
    - SUPPORT different documentation types (goals, why, context)

  CREATE src/tools/tag-management-tools.ts:
    - IMPLEMENT createTag, getTags, updateTag, deleteTag tools
    - INCLUDE tag assignment to tasks and documentation
    - ADD color and description management
    - ENSURE unique tag names and proper validation

Task 7 - MCP Server Integration:
  UPDATE src/index.ts:
    - MODIFY class name to DeepifyMCP
    - ENSURE all new tools are registered via registerAllTools
    - KEEP existing authentication and database patterns
    - ADD proper cleanup for Anthropic API connections

  UPDATE src/tools/register-tools.ts:
    - IMPORT all new tool registration functions
    - CALL registration functions in proper order
    - MAINTAIN existing database tool registrations

Task 8 - Type Definitions:
  CREATE src/types/prp-types.ts:
    - DEFINE all PRP-related TypeScript interfaces
    - INCLUDE Zod schema exports
    - ENSURE type safety for API responses

  UPDATE src/types.ts:
    - ADD new environment variables (ANTHROPIC_API_KEY, etc.)
    - INCLUDE new tool schemas in exports
    - MAINTAIN existing type definitions

Task 9 - Local Testing:
  TEST basic functionality:
    - RUN: npm run type-check (fix any TypeScript errors)
    - RUN: wrangler dev
    - VERIFY server starts without errors
    - TEST OAuth flow: http://localhost:8792/authorize
    - VERIFY MCP endpoint: http://localhost:8792/mcp

  TEST PRP parsing:
    - CREATE test PRP content
    - CALL parsePRP tool via MCP Inspector
    - VERIFY tasks and documentation are extracted
    - CHECK database storage of results

Task 10 - Production Deployment:
  SETUP Cloudflare production secrets:
    - RUN: wrangler secret put ANTHROPIC_API_KEY
    - RUN: wrangler secret put ANTHROPIC_MODEL
    - VERIFY other secrets are set (GitHub OAuth, database, etc.)

  DEPLOY to deepify.org:
    - RUN: wrangler deploy
    - VERIFY deployment to deepify.org domain
    - TEST production OAuth flow
    - VERIFY MCP endpoint accessibility
    - TEST PRP parsing in production environment
```

### Per Task Implementation Details

```typescript
// Task 3 - Anthropic Client Service Implementation
export class AnthropicClient {
  constructor(
    private apiKey: string,
    private model: string = 'claude-3-5-haiku-latest'
  ) {}

  async parsePRP(prpContent: string, projectContext?: any): Promise<PRPParsingResult> {
    const prompt = this.buildPRPParsingPrompt(prpContent, projectContext);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to parse PRP: ${error.message}`);
    }
  }

  private buildPRPParsingPrompt(prpContent: string, projectContext?: any): string {
    return `
You are an expert at parsing Product Requirements Prompts (PRPs) and extracting structured task and documentation data.

Please analyze the following PRP content and extract:
1. Individual tasks with titles, descriptions, priorities, and estimated effort
2. Project documentation including goals, target users, and context
3. Any constraints, dependencies, or special considerations

PRP Content:
${prpContent}

Return your response as valid JSON with this exact structure:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "estimatedHours": 8,
      "dependencies": ["other task titles"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "documentation": [
    {
      "type": "goals|why|target_users|context|requirements",
      "title": "Documentation title",
      "content": "Detailed content",
      "importance": "high|medium|low"
    }
  ],
  "projectContext": {
    "projectName": "Extracted or inferred project name",
    "description": "Project overview",
    "targetUsers": ["user type 1", "user type 2"],
    "goals": ["goal 1", "goal 2"],
    "constraints": ["constraint 1", "constraint 2"]
  }
}

Focus on extracting actionable, specific tasks and comprehensive documentation. Be thorough but concise.
`;
  }
}

// Task 4 - PRP Parser Tool Implementation
export function registerPRPParserTools(server: McpServer, env: Env, props: Props) {
  server.tool(
    "parsePRP",
    "Parse a Product Requirements Prompt (PRP) using Anthropic Claude AI to extract structured tasks, documentation, and project context. Stores results in database for future reference.",
    ParsePRPSchema,
    async ({ prpContent, projectName }) => {
      try {
        // Initialize Anthropic client
        const client = new AnthropicClient(
          env.ANTHROPIC_API_KEY,
          env.ANTHROPIC_MODEL
        );

        // Parse PRP using Claude
        const parsedResult = await client.parsePRP(prpContent);

        // Store parsing history
        await withDatabase(env.DATABASE_URL, async (db) => {
          await db`
            INSERT INTO prp_parsing_history (prp_content, extracted_data, parsing_model, parsed_by)
            VALUES (${prpContent}, ${JSON.stringify(parsedResult)}, ${env.ANTHROPIC_MODEL}, ${props.login})
          `;
        });

        return {
          content: [
            {
              type: "text",
              text: `**PRP Parsing Complete**\n\n**Extracted Tasks:** ${parsedResult.tasks.length}\n**Documentation Sections:** ${parsedResult.documentation.length}\n\n**Tasks:**\n${parsedResult.tasks.map(t => `• ${t.title} (${t.priority} priority)`).join('\n')}\n\n**Project Context:**\n${JSON.stringify(parsedResult.projectContext, null, 2)}\n\n*Use createTask and createDocumentation tools to save specific items to the database.*`
            }
          ]
        };
      } catch (error) {
        console.error('PRP parsing error:', error);
        return createErrorResponse(`PRP parsing failed: ${error.message}`);
      }
    }
  );
}
```

### Integration Points

```yaml
CLOUDFLARE_WORKERS:
  - wrangler.jsonc: Update for deepify.org deployment
  - Environment secrets: GitHub OAuth, database, Anthropic API credentials
  - Durable Objects: DeepifyMCP binding for state persistence

GITHUB_OAUTH:
  - GitHub App: Callback URL for deepify.org domain
  - Client credentials: Store as Cloudflare Workers secrets
  - Callback URL: https://deepify.org/callback

DATABASE:
  - PostgreSQL: Complete schema for PRP-derived data
  - Connection pooling: Use existing patterns from database/utils.ts
  - Security: Validate all SQL with existing security patterns

ANTHROPIC_API:
  - API Key: Store as Cloudflare Workers secret
  - Model Selection: Environment-configurable (default: claude-3-5-haiku-latest)
  - Rate Limiting: Implement proper retry and error handling
  - Content Filtering: Validate PRP content before API calls

ENVIRONMENT_VARIABLES:
  - Development: .dev.vars for local testing
  - Production: Cloudflare Workers secrets
  - Required: All existing + ANTHROPIC_API_KEY, ANTHROPIC_MODEL
```

## Validation Gate

### Level 1: TypeScript & Configuration

```bash
# CRITICAL: Run these FIRST - fix any errors before proceeding
npm run type-check                 # TypeScript compilation
wrangler types                     # Generate Cloudflare Workers types

# Expected: No TypeScript errors
# If errors: Fix type issues, missing interfaces, import problems
```

### Level 2: Local Development Testing

```bash
# Start local development server
wrangler dev

# Test OAuth flow (should redirect to GitHub)
curl -v http://localhost:8792/authorize

# Test MCP endpoint (should return server info with PRP tools)
curl -v http://localhost:8792/mcp

# Expected: Server starts, OAuth works, MCP shows PRP parsing tools
# If errors: Check console, verify environment variables, fix configuration
```

### Level 3: Unit Testing

```bash
# Run comprehensive unit tests
npm run test

# Test database schema
# Test Anthropic API integration
# Test PRP parsing logic
# Test task management CRUD operations
# Test documentation management
# Test permission enforcement
```

### Level 4: PRP Parsing Integration Testing

```bash
# Test PRP parsing with sample content
curl -X POST http://localhost:8792/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "parsePRP",
      "arguments": {
        "prpContent": "Sample PRP content with tasks and goals...",
        "projectName": "Test Project"
      }
    }
  }'

# Test task creation from parsed data
# Test documentation storage
# Test tag management
# Test database queries and updates

# Expected: PRP parsing works, data stored correctly, CRUD operations functional
# If errors: Check Anthropic API connectivity, database schema, permission logic
```

## Final Validation Checklist

### Core Functionality

- [ ] TypeScript compilation: `npm run type-check` passes
- [ ] Unit tests pass: `npm run test` passes  
- [ ] Local server starts: `wrangler dev` runs without errors
- [ ] MCP endpoint responds: Shows PRP parsing tools in tool list
- [ ] OAuth flow works: Authentication for deepify.org domain
- [ ] Database schema: All tables created with proper relationships
- [ ] Anthropic API: PRP parsing extracts structured tasks and documentation
- [ ] Task management: All CRUD operations work with proper validation
- [ ] Documentation management: Storage and retrieval of PRP-derived docs
- [ ] Tag management: Create and assign tags to tasks and documentation
- [ ] Production deployment: Successfully deploys to deepify.org
- [ ] Permission enforcement: Read/write operations properly restricted

---

## Anti-Patterns to Avoid

### MCP-Specific

- ❌ Don't skip input validation - always validate PRP content and parameters
- ❌ Don't forget cleanup() method for Durable Objects with database connections
- ❌ Don't hardcode Anthropic API credentials - use environment variables
- ❌ Don't ignore API rate limits - implement proper error handling and retries

### PRP Parsing Specific

- ❌ Don't use complex regex for PRP parsing - rely on Claude AI for intelligent extraction
- ❌ Don't store Anthropic API keys in code - use Cloudflare Workers secrets
- ❌ Don't skip validation of Claude API responses - ensure JSON structure
- ❌ Don't ignore PRP parsing failures - provide meaningful error messages

### Development Process

- ❌ Don't skip validation loops - test each component thoroughly
- ❌ Don't deploy without testing PRP parsing end-to-end
- ❌ Don't ignore database performance - create proper indexes
- ❌ Don't skip permission testing - verify access control works correctly