import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props, Env } from "../types";
import { registerDatabaseTools } from "../../examples/database-tools";
import { registerPRPParserTools } from "./prp-parser-tools";
import { registerTaskManagementTools } from "./task-management-tools";
import { registerDocumentationTools } from "./documentation-tools";
import { registerTagManagementTools } from "./tag-management-tools";

/**
 * Register all MCP tools based on user permissions
 * 
 * This includes:
 * - Original database tools for SQL operations
 * - PRP parsing tools for analyzing Product Requirements Prompts
 * - Task management tools for CRUD operations on tasks
 * - Documentation management tools for project documentation
 * - Tag management tools for organizing content
 */
export function registerAllTools(server: McpServer, env: Env, props: Props) {
	// Register database tools (existing functionality) - cast env to match expected interface
	registerDatabaseTools(server, env as any, props);
	
	// Register PRP parsing and management tools
	registerPRPParserTools(server, env, props);
	
	// Register task management tools
	registerTaskManagementTools(server, env, props);
	
	// Register documentation management tools
	registerDocumentationTools(server, env, props);
	
	// Register tag management tools
	registerTagManagementTools(server, env, props);
}