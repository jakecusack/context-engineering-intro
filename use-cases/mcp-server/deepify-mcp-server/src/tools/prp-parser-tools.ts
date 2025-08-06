/**
 * PRP Parser Tools for MCP Server
 * 
 * Tools for parsing Product Requirements Prompts (PRPs) using Anthropic Claude AI
 * and storing parsing results in the database for future reference.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props, Env, createErrorResponse, createSuccessResponse } from "../types";
import { z } from "zod";
import { 
  ParsePRPSchema, 
  PRPParsingResult, 
  ParsePRPInput,
  ProjectNameSchema
} from "../types/prp-types";
import { PRPParserService } from "../services/prp-parser";
import { withDatabase } from "../database/utils";

// Users who can parse PRPs (can be expanded to include read-only users)
const ALLOWED_USERS = new Set<string>([
  'coleam00', // Add your GitHub username
  // Add other authorized users here
]);

export function registerPRPParserTools(server: McpServer, env: Env, props: Props) {
  
  // Tool 1: Parse PRP Content using Anthropic Claude
  server.tool(
    "parsePRP",
    "Parse a Product Requirements Prompt (PRP) using Anthropic Claude AI to extract structured tasks, documentation, and project context. Results are stored in database for audit and future reference.",
    ParsePRPSchema.shape,
    async ({ prpContent, projectName, projectContext }) => {
      try {
        // Initialize PRP parser service
        const parserService = new PRPParserService(
          env.ANTHROPIC_API_KEY,
          env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest'
        );

        // Parse PRP content
        const parseOptions = {
          projectContext: projectContext || (projectName ? { projectName } : undefined)
        };
        
        const parsedResult = await parserService.parsePRP(prpContent, parseOptions);

        // Store parsing history in database
        let parsingHistoryId: number | undefined;
        try {
          await withDatabase(env.DATABASE_URL, async (db) => {
            const historyResult = await db`
              INSERT INTO prp_parsing_history (
                prp_content, 
                extracted_data, 
                parsing_model, 
                parsed_by, 
                status,
                project_name
              )
              VALUES (
                ${prpContent}, 
                ${JSON.stringify(parsedResult)}, 
                ${env.ANTHROPIC_MODEL}, 
                ${props.login}, 
                'success',
                ${parsedResult.projectContext.projectName}
              )
              RETURNING id
            `;
            parsingHistoryId = historyResult[0]?.id;
          });
        } catch (dbError) {
          console.error('Failed to store parsing history:', dbError);
          // Continue execution - parsing succeeded even if history storage failed
        }

        // Format response
        const taskSummary = parsedResult.tasks.map(task => 
          `• ${task.title} (${task.priority} priority${task.estimatedHours ? `, ~${task.estimatedHours}h` : ''})`
        ).join('\n');

        const docSummary = parsedResult.documentation.map(doc => 
          `• ${doc.title} (${doc.type}, ${doc.importance} importance)`
        ).join('\n');

        const responseText = `**PRP Parsing Complete!** 🎉

**Project:** ${parsedResult.projectContext.projectName}
**Total Tasks Extracted:** ${parsedResult.tasks.length}
**Documentation Sections:** ${parsedResult.documentation.length}
**Estimated Total Hours:** ${parsedResult.metadata.totalEstimatedHours}
**Complexity Level:** ${parsedResult.metadata.complexityLevel}

**Extracted Tasks:**
${taskSummary}

**Documentation Sections:**
${docSummary}

**Project Context:**
- **Description:** ${parsedResult.projectContext.description}
- **Target Users:** ${parsedResult.projectContext.targetUsers.join(', ') || 'Not specified'}
- **Goals:** ${parsedResult.projectContext.goals.join(', ') || 'Not specified'}
- **Constraints:** ${parsedResult.projectContext.constraints.join(', ') || 'Not specified'}

**Suggested Tags:** ${parsedResult.metadata.suggestedTags.join(', ')}

${parsingHistoryId ? `**Parsing History ID:** ${parsingHistoryId}` : ''}

*Next Steps:*
- Use \`createTask\` to save specific tasks to the database
- Use \`createDocumentation\` to save documentation sections
- Use \`createTag\` to create project-specific tags
- Use \`getParsingHistory\` to review previous parsing sessions`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('PRP parsing error:', error);
        
        // Store failed parsing attempt
        try {
          await withDatabase(env.DATABASE_URL, async (db) => {
            await db`
              INSERT INTO prp_parsing_history (
                prp_content, 
                parsing_model, 
                parsed_by, 
                status,
                error_message,
                project_name
              )
              VALUES (
                ${prpContent}, 
                ${env.ANTHROPIC_MODEL}, 
                ${props.login}, 
                'error',
                ${error instanceof Error ? error.message : String(error)},
                ${projectName || null}
              )
            `;
          });
        } catch (dbError) {
          console.error('Failed to store error history:', dbError);
        }

        return createErrorResponse(`PRP parsing failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 2: Get PRP Parsing History
  server.tool(
    "getParsingHistory",
    "Retrieve history of PRP parsing sessions for the current user or a specific project. Useful for reviewing previous parsing results and tracking project evolution.",
    {
      projectName: ProjectNameSchema.shape.projectName.optional(),
      limit: z.number().int().min(1).max(100).default(10).optional()
    },
    async ({ projectName, limit = 10 }) => {
      try {
        const historyResults = await withDatabase(env.DATABASE_URL, async (db) => {
          if (projectName) {
            return await db`
              SELECT 
                id,
                project_name,
                parsing_model,
                parsing_timestamp,
                status,
                error_message,
                CASE 
                  WHEN LENGTH(prp_content) > 200 THEN LEFT(prp_content, 200) || '...'
                  ELSE prp_content
                END as prp_content_preview
              FROM prp_parsing_history 
              WHERE parsed_by = ${props.login} 
                AND project_name = ${projectName}
              ORDER BY parsing_timestamp DESC 
              LIMIT ${limit}
            `;
          } else {
            return await db`
              SELECT 
                id,
                project_name,
                parsing_model,
                parsing_timestamp,
                status,
                error_message,
                CASE 
                  WHEN LENGTH(prp_content) > 200 THEN LEFT(prp_content, 200) || '...'
                  ELSE prp_content
                END as prp_content_preview
              FROM prp_parsing_history 
              WHERE parsed_by = ${props.login}
              ORDER BY parsing_timestamp DESC 
              LIMIT ${limit}
            `;
          }
        });

        if (historyResults.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `**No Parsing History Found**\n\nNo PRP parsing history found${projectName ? ` for project "${projectName}"` : ''}.`
              }
            ]
          };
        }

        const historyText = historyResults.map(result => {
          const status = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
          const timestamp = new Date(result.parsing_timestamp).toLocaleString();
          const errorInfo = result.error_message ? `\n  **Error:** ${result.error_message}` : '';
          
          return `${status} **${result.project_name || 'Unnamed Project'}** (ID: ${result.id})
  **Time:** ${timestamp}
  **Model:** ${result.parsing_model}
  **Status:** ${result.status}${errorInfo}
  **Preview:** ${result.prp_content_preview}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: "text",
              text: `**PRP Parsing History** 📚\n\n${historyText}\n\n*Use \`getParsingDetails\` with a specific ID to view full parsing results.*`
            }
          ]
        };
      } catch (error) {
        console.error('Error retrieving parsing history:', error);
        return createErrorResponse(`Failed to retrieve parsing history: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 3: Get Detailed Parsing Results
  server.tool(
    "getParsingDetails",
    "Get detailed results from a specific PRP parsing session, including all extracted tasks and documentation.",
    {
      parsingId: z.number().int().positive()
    },
    async ({ parsingId }) => {
      try {
        const parsingResult = await withDatabase(env.DATABASE_URL, async (db) => {
          const results = await db`
            SELECT 
              id,
              prp_content,
              extracted_data,
              parsing_model,
              parsing_timestamp,
              status,
              error_message,
              project_name
            FROM prp_parsing_history 
            WHERE id = ${parsingId} 
              AND parsed_by = ${props.login}
          `;
          return results[0];
        });

        if (!parsingResult) {
          return createErrorResponse(`Parsing session ${parsingId} not found or you don't have access to it.`);
        }

        if (parsingResult.status === 'error') {
          return {
            content: [
              {
                type: "text",
                text: `**Parsing Session ${parsingId} - Failed** ❌

**Project:** ${parsingResult.project_name || 'Unnamed'}
**Timestamp:** ${new Date(parsingResult.parsing_timestamp).toLocaleString()}
**Model:** ${parsingResult.parsing_model}
**Error:** ${parsingResult.error_message}

**Original PRP Content:**
\`\`\`
${parsingResult.prp_content}
\`\`\``
              }
            ]
          };
        }

        const extractedData = parsingResult.extracted_data as PRPParsingResult;
        
        const taskDetails = extractedData.tasks.map((task, index) => 
          `${index + 1}. **${task.title}**
   - Priority: ${task.priority}
   - Estimated Hours: ${task.estimatedHours || 'Not specified'}
   - Tags: ${task.tags?.join(', ') || 'None'}
   - Dependencies: ${task.dependencies?.join(', ') || 'None'}
   - Description: ${task.description}`
        ).join('\n\n');

        const docDetails = extractedData.documentation.map((doc, index) =>
          `${index + 1}. **${doc.title}** (${doc.type})
   - Importance: ${doc.importance}
   - Content: ${doc.content}`
        ).join('\n\n');

        const responseText = `**Parsing Session ${parsingId} - Details** 📋

**Project:** ${extractedData.projectContext.projectName}
**Timestamp:** ${new Date(parsingResult.parsing_timestamp).toLocaleString()}
**Model:** ${parsingResult.parsing_model}

**Project Context:**
- **Description:** ${extractedData.projectContext.description}
- **Target Users:** ${extractedData.projectContext.targetUsers.join(', ') || 'Not specified'}
- **Goals:** ${extractedData.projectContext.goals.join(', ') || 'Not specified'}

**Tasks (${extractedData.tasks.length}):**
${taskDetails}

**Documentation (${extractedData.documentation.length}):**
${docDetails}

**Metadata:**
- **Total Estimated Hours:** ${extractedData.metadata.totalEstimatedHours}
- **High Priority Tasks:** ${extractedData.metadata.highPriorityTasks}
- **Complexity Level:** ${extractedData.metadata.complexityLevel}
- **Suggested Tags:** ${extractedData.metadata.suggestedTags.join(', ')}`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Error retrieving parsing details:', error);
        return createErrorResponse(`Failed to retrieve parsing details: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 4: Test Anthropic Connection
  if (ALLOWED_USERS.has(props.login)) {
    server.tool(
      "testAnthropicConnection",
      "Test the connection to Anthropic API to ensure PRP parsing is properly configured. Admin-only tool.",
      {},
      async () => {
        try {
          const parserService = new PRPParserService(
            env.ANTHROPIC_API_KEY,
            env.ANTHROPIC_MODEL
          );

          const isConnected = await parserService.testConnection();

          if (isConnected) {
            return createSuccessResponse(`Anthropic API connection successful! Using model: ${env.ANTHROPIC_MODEL}`);
          } else {
            return createErrorResponse('Anthropic API connection failed. Check your API key and network connectivity.');
          }
        } catch (error) {
          console.error('Anthropic connection test error:', error);
          return createErrorResponse(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );
  }
}