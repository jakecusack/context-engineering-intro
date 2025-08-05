/**
 * Documentation Management Tools for MCP Server
 * 
 * Tools for managing project documentation including goals, requirements,
 * context, and other PRP-derived documentation with tag management.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props, Env, createErrorResponse, createSuccessResponse } from "../types";
import { 
  CreateDocumentationSchema, 
  UpdateDocumentationSchema, 
  GetDocumentationSchema, 
  DeleteDocumentationSchema,
  ProjectNameSchema,
  IdSchema
} from "../types/prp-types";
import { withDatabase } from "../database/utils";

// Users with write access to documentation
const WRITE_ACCESS_USERS = new Set<string>([
  'coleam00', // Add your GitHub username
  // Add other users with write access
]);

export function registerDocumentationTools(server: McpServer, env: Env, props: Props) {
  
  // Tool 1: Create Documentation
  server.tool(
    "createDocumentation",
    "Create project documentation such as goals, requirements, context, or target user information. Can be used to store documentation extracted from PRP parsing.",
    CreateDocumentationSchema.shape,
    async ({ projectName, docType, title, content, importance, prpSource, tags }) => {
      try {
        const docResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Insert the documentation
          const docInsert = await db`
            INSERT INTO documentation (
              project_name,
              doc_type,
              title,
              content,
              importance,
              prp_source,
              created_by
            )
            VALUES (
              ${projectName},
              ${docType},
              ${title},
              ${content},
              ${importance},
              ${prpSource || null},
              ${props.login}
            )
            RETURNING *
          `;

          const doc = docInsert[0];

          // Assign tags if provided
          if (tags && tags.length > 0) {
            for (const tagName of tags) {
              // Get or create tag
              let tagResult = await db`
                SELECT id FROM tags WHERE name = ${tagName}
              `;

              let tagId: number;
              if (tagResult.length === 0) {
                // Create new tag
                const newTag = await db`
                  INSERT INTO tags (name, created_by)
                  VALUES (${tagName}, ${props.login})
                  RETURNING id
                `;
                tagId = newTag[0].id;
              } else {
                tagId = tagResult[0].id;
              }

              // Assign tag to documentation
              await db`
                INSERT INTO documentation_tags (documentation_id, tag_id)
                VALUES (${doc.id}, ${tagId})
                ON CONFLICT DO NOTHING
              `;
            }
          }

          // Return documentation with tags
          const docWithTags = await db`
            SELECT 
              d.*,
              string_agg(tags.name, ', ') as tag_names
            FROM documentation d
            LEFT JOIN documentation_tags dt ON d.id = dt.documentation_id
            LEFT JOIN tags ON dt.tag_id = tags.id
            WHERE d.id = ${doc.id}
            GROUP BY d.id
          `;

          return docWithTags[0];
        });

        const responseText = `**Documentation Created Successfully!** 📚

**Documentation ID:** ${docResult.id}
**Project:** ${docResult.project_name}
**Type:** ${docResult.doc_type}
**Title:** ${docResult.title}
**Importance:** ${docResult.importance}
**Tags:** ${docResult.tag_names || 'None'}
**PRP Source:** ${docResult.prp_source || 'Manual entry'}
**Created By:** ${docResult.created_by}

**Content Preview:**
${docResult.content.length > 200 ? docResult.content.substring(0, 200) + '...' : docResult.content}

*Use \`getDocumentation\` to view all documentation or \`updateDocumentation\` to modify this entry.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Create documentation error:', error);
        return createErrorResponse(`Failed to create documentation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 2: Get Documentation
  server.tool(
    "getDocumentation",
    "Retrieve project documentation with filtering options. Supports filtering by project, document type, and importance level.",
    GetDocumentationSchema.shape,
    async ({ projectName, docType, importance, limit, offset, sortBy, sortOrder }) => {
      try {
        const docsResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Build WHERE clause dynamically
          const conditions: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (projectName) {
            conditions.push(`d.project_name = $${paramIndex}`);
            values.push(projectName);
            paramIndex++;
          }

          if (docType) {
            conditions.push(`d.doc_type = $${paramIndex}`);
            values.push(docType);
            paramIndex++;
          }

          if (importance) {
            conditions.push(`d.importance = $${paramIndex}`);
            values.push(importance);
            paramIndex++;
          }

          const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

          // Build ORDER BY clause
          const validSortColumns = {
            'created_at': 'd.created_at',
            'updated_at': 'd.updated_at',
            'title': 'd.title'
          };
          
          const sortColumn = validSortColumns[sortBy as keyof typeof validSortColumns] || 'd.created_at';
          const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
          
          // Add limit and offset
          values.push(limit, offset);
          const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

          const query = `
            SELECT 
              d.id,
              d.project_name,
              d.doc_type,
              d.title,
              d.content,
              d.importance,
              d.prp_source,
              d.created_by,
              d.created_at,
              d.updated_at,
              string_agg(tags.name, ', ') as tag_names
            FROM documentation d
            LEFT JOIN documentation_tags dt ON d.id = dt.documentation_id
            LEFT JOIN tags ON dt.tag_id = tags.id
            ${whereClause}
            GROUP BY d.id, d.project_name, d.doc_type, d.title, d.content, d.importance,
                     d.prp_source, d.created_by, d.created_at, d.updated_at
            ${orderClause}
            ${limitClause}
          `;

          return await db.unsafe(query, values);
        });

        if (docsResult.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `**No Documentation Found** 📚\n\nNo documentation matches your filter criteria.${projectName ? ` Project: ${projectName}` : ''}${docType ? ` Type: ${docType}` : ''}`
              }
            ]
          };
        }

        const docsList = docsResult.map((doc, index) => {
          const typeEmoji = {
            'goals': '🎯',
            'why': '💡',
            'target_users': '👥',
            'context': '📋',
            'requirements': '📝',
            'constraints': '⚠️'
          }[doc.doc_type as 'goals' | 'why' | 'target_users' | 'context' | 'requirements' | 'constraints'] || '📄';

          const importanceEmoji = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
          }[doc.importance as 'high' | 'medium' | 'low'] || '⚪';

          return `${index + 1}. ${typeEmoji} **${doc.title}** (ID: ${doc.id})
   📂 Project: ${doc.project_name} | ${importanceEmoji} Importance: ${doc.importance}
   📋 Type: ${doc.doc_type} | 🏷️ Tags: ${doc.tag_names || 'None'}
   👤 Created by: ${doc.created_by} | 📅 ${new Date(doc.created_at).toLocaleDateString()}
   📄 ${doc.content.substring(0, 150)}${doc.content.length > 150 ? '...' : ''}`;
        }).join('\n\n');

        const responseText = `**Documentation (${docsResult.length})** 📚

${docsList}

*Showing ${docsResult.length} documents (offset: ${offset}, limit: ${limit})*
*Use \`updateDocumentation\` to modify or \`deleteDocumentation\` to remove entries.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get documentation error:', error);
        return createErrorResponse(`Failed to retrieve documentation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 3: Update Documentation
  server.tool(
    "updateDocumentation",
    "Update existing documentation. Users can update their own documentation, or privileged users can update any documentation.",
    UpdateDocumentationSchema.shape,
    async ({ id, projectName, docType, title, content, importance }) => {
      try {
        const updateResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if documentation exists and user has permission
          const existingDoc = await db`
            SELECT created_by FROM documentation WHERE id = ${id}
          `;

          if (existingDoc.length === 0) {
            throw new Error(`Documentation with ID ${id} not found`);
          }

          // Check permissions
          const canEdit = existingDoc[0].created_by === props.login || WRITE_ACCESS_USERS.has(props.login);
          if (!canEdit) {
            throw new Error('You can only update documentation you created, unless you have privileged access');
          }

          // Build update query dynamically
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (projectName !== undefined) {
            updates.push(`project_name = $${paramIndex}`);
            values.push(projectName);
            paramIndex++;
          }

          if (docType !== undefined) {
            updates.push(`doc_type = $${paramIndex}`);
            values.push(docType);
            paramIndex++;
          }

          if (title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            values.push(title);
            paramIndex++;
          }

          if (content !== undefined) {
            updates.push(`content = $${paramIndex}`);
            values.push(content);
            paramIndex++;
          }

          if (importance !== undefined) {
            updates.push(`importance = $${paramIndex}`);
            values.push(importance);
            paramIndex++;
          }

          if (updates.length === 0) {
            throw new Error('No fields to update');
          }

          // Always update the updated_at timestamp
          updates.push(`updated_at = $${paramIndex}`);
          values.push(new Date());
          paramIndex++;

          // Add documentation ID to the end
          values.push(id);

          const query = `
            UPDATE documentation 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          const result = await db.unsafe(query, values);
          
          // Get documentation with tags
          const docWithTags = await db`
            SELECT 
              d.*,
              string_agg(tags.name, ', ') as tag_names
            FROM documentation d
            LEFT JOIN documentation_tags dt ON d.id = dt.documentation_id
            LEFT JOIN tags ON dt.tag_id = tags.id
            WHERE d.id = ${id}
            GROUP BY d.id
          `;

          return docWithTags[0];
        });

        const responseText = `**Documentation Updated Successfully!** ✅

**Documentation ID:** ${updateResult.id}
**Project:** ${updateResult.project_name}
**Type:** ${updateResult.doc_type}
**Title:** ${updateResult.title}
**Importance:** ${updateResult.importance}
**Tags:** ${updateResult.tag_names || 'None'}
**Last Updated:** ${new Date(updateResult.updated_at).toLocaleString()}

**Content:**
${updateResult.content}

*Use \`getDocumentation\` to view the updated documentation in context.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Update documentation error:', error);
        return createErrorResponse(`Failed to update documentation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 4: Delete Documentation
  server.tool(
    "deleteDocumentation",
    "Delete documentation. Users can delete their own documentation, or privileged users can delete any documentation. This action cannot be undone.",
    DeleteDocumentationSchema.shape,
    async ({ id }) => {
      try {
        const deleteResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if documentation exists and user has permission
          const existingDoc = await db`
            SELECT created_by, title FROM documentation WHERE id = ${id}
          `;

          if (existingDoc.length === 0) {
            throw new Error(`Documentation with ID ${id} not found`);
          }

          // Check permissions
          const canDelete = existingDoc[0].created_by === props.login || WRITE_ACCESS_USERS.has(props.login);
          if (!canDelete) {
            throw new Error('You can only delete documentation you created, unless you have privileged access');
          }

          const docTitle = existingDoc[0].title;

          // Delete the documentation (tags will be deleted via CASCADE)
          await db`DELETE FROM documentation WHERE id = ${id}`;

          return { docTitle };
        });

        return createSuccessResponse(`Documentation "${deleteResult.docTitle}" (ID: ${id}) has been deleted successfully.`);
      } catch (error) {
        console.error('Delete documentation error:', error);
        return createErrorResponse(`Failed to delete documentation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 5: Get Documentation by Project
  server.tool(
    "getProjectDocumentation",
    "Get all documentation for a specific project, organized by type. Useful for getting a complete project overview.",
    ProjectNameSchema.shape,
    async ({ projectName }) => {
      try {
        const docsResult = await withDatabase(env.DATABASE_URL, async (db) => {
          return await db`
            SELECT 
              d.id,
              d.doc_type,
              d.title,
              d.content,
              d.importance,
              d.created_by,
              d.created_at,
              string_agg(tags.name, ', ') as tag_names
            FROM documentation d
            LEFT JOIN documentation_tags dt ON d.id = dt.documentation_id
            LEFT JOIN tags ON dt.tag_id = tags.id
            WHERE d.project_name = ${projectName}
            GROUP BY d.id, d.doc_type, d.title, d.content, d.importance, d.created_by, d.created_at
            ORDER BY 
              CASE d.doc_type 
                WHEN 'goals' THEN 1 
                WHEN 'why' THEN 2 
                WHEN 'target_users' THEN 3 
                WHEN 'requirements' THEN 4 
                WHEN 'context' THEN 5 
                WHEN 'constraints' THEN 6 
                ELSE 7 
              END,
              d.importance DESC,
              d.created_at ASC
          `;
        });

        if (docsResult.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `**No Documentation Found** 📚\n\nNo documentation found for project "${projectName}".`
              }
            ]
          };
        }

        // Group by document type
        const docsByType = docsResult.reduce((acc, doc) => {
          if (!acc[doc.doc_type]) {
            acc[doc.doc_type] = [];
          }
          acc[doc.doc_type].push(doc);
          return acc;
        }, {} as Record<string, any[]>);

        const typeLabels = {
          'goals': '🎯 Goals',
          'why': '💡 Why / Rationale',
          'target_users': '👥 Target Users',
          'requirements': '📝 Requirements',
          'context': '📋 Context',
          'constraints': '⚠️ Constraints'
        };

        const sections = Object.entries(docsByType).map(([type, docs]) => {
          const typeLabel = typeLabels[type as keyof typeof typeLabels] || `📄 ${type}`;
          const docsList = docs.map((doc: any) => {
            const importanceEmoji = { 'high': '🔴', 'medium': '🟡', 'low': '🟢' }[doc.importance as 'high' | 'medium' | 'low'] || '⚪';
            return `   ${importanceEmoji} **${doc.title}** (ID: ${doc.id})
      ${doc.content}
      *Tags: ${doc.tag_names || 'None'} | Created by: ${doc.created_by}*`;
          }).join('\n\n');

          return `## ${typeLabel}\n\n${docsList}`;
        }).join('\n\n');

        const responseText = `**Project Documentation: ${projectName}** 📚

${sections}

**Summary:** ${docsResult.length} documentation entries found across ${Object.keys(docsByType).length} categories.

*Use \`updateDocumentation\` to modify entries or \`createDocumentation\` to add new documentation.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get project documentation error:', error);
        return createErrorResponse(`Failed to retrieve project documentation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 6: Assign Tags to Documentation
  server.tool(
    "assignTagsToDocumentation",
    "Assign one or more tags to documentation. Creates tags if they don't exist.",
    {
      documentationId: IdSchema.shape.id,
      tagNames: CreateDocumentationSchema.shape.tags
    },
    async ({ documentationId, tagNames }) => {
      try {
        if (!tagNames || tagNames.length === 0) {
          return createErrorResponse('At least one tag name is required');
        }

        await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if documentation exists
          const doc = await db`SELECT id, title FROM documentation WHERE id = ${documentationId}`;
          if (doc.length === 0) {
            throw new Error(`Documentation with ID ${documentationId} not found`);
          }

          // Process each tag
          for (const tagName of tagNames) {
            // Get or create tag
            let tagResult = await db`
              SELECT id FROM tags WHERE name = ${tagName}
            `;

            let tagId: number;
            if (tagResult.length === 0) {
              // Create new tag
              const newTag = await db`
                INSERT INTO tags (name, created_by)
                VALUES (${tagName}, ${props.login})
                RETURNING id
              `;
              tagId = newTag[0].id;
            } else {
              tagId = tagResult[0].id;
            }

            // Assign tag to documentation
            await db`
              INSERT INTO documentation_tags (documentation_id, tag_id)
              VALUES (${documentationId}, ${tagId})
              ON CONFLICT DO NOTHING
            `;
          }
        });

        return createSuccessResponse(`Tags "${tagNames.join(', ')}" assigned to documentation ${documentationId}.`);
      } catch (error) {
        console.error('Assign tags to documentation error:', error);
        return createErrorResponse(`Failed to assign tags: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}