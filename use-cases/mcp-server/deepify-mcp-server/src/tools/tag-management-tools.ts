/**
 * Tag Management Tools for MCP Server
 * 
 * Tools for creating, managing, and organizing tags for tasks and documentation.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props, Env, createErrorResponse, createSuccessResponse } from "../types";
import { 
  CreateTagSchema, 
  UpdateTagSchema, 
  GetTagsSchema, 
  DeleteTagSchema,
  IdSchema
} from "../types/prp-types";
import { withDatabase } from "../database/utils";

export function registerTagManagementTools(server: McpServer, env: Env, props: Props) {
  
  // Tool 1: Create Tag
  server.tool(
    "createTag",
    "Create a new tag for organizing tasks and documentation. Tags help categorize and filter content.",
    CreateTagSchema.shape,
    async ({ name, color, description }) => {
      try {
        const tagResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if tag already exists
          const existingTag = await db`
            SELECT id FROM tags WHERE name = ${name}
          `;

          if (existingTag.length > 0) {
            throw new Error(`Tag "${name}" already exists`);
          }

          // Create the tag
          const tagInsert = await db`
            INSERT INTO tags (name, color, description, created_by)
            VALUES (${name}, ${color || null}, ${description || null}, ${props.login})
            RETURNING *
          `;

          return tagInsert[0];
        });

        const responseText = `**Tag Created Successfully!** 🏷️

**Tag ID:** ${tagResult.id}
**Name:** ${tagResult.name}
**Color:** ${tagResult.color || 'Default'}
**Description:** ${tagResult.description || 'No description provided'}
**Created By:** ${tagResult.created_by}

*Use this tag when creating tasks or documentation, or assign it to existing items with \`assignTagsToTask\` or \`assignTagsToDocumentation\`.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Create tag error:', error);
        return createErrorResponse(`Failed to create tag: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 2: Get Tags
  server.tool(
    "getTags",
    "Retrieve all tags with optional search filtering. Shows usage statistics for each tag.",
    GetTagsSchema.shape,
    async ({ search, limit, offset }) => {
      try {
        const tagsResult = await withDatabase(env.DATABASE_URL, async (db) => {
          let whereClause = '';
          const values: any[] = [];
          let paramIndex = 1;

          if (search) {
            whereClause = `WHERE t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex}`;
            values.push(`%${search}%`);
            paramIndex++;
          }

          // Add limit and offset
          values.push(limit, offset);
          const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

          const query = `
            SELECT 
              t.id,
              t.name,
              t.color,
              t.description,
              t.created_by,
              t.created_at,
              COUNT(DISTINCT tt.task_id) as task_count,
              COUNT(DISTINCT dt.documentation_id) as documentation_count,
              (COUNT(DISTINCT tt.task_id) + COUNT(DISTINCT dt.documentation_id)) as total_usage
            FROM tags t
            LEFT JOIN task_tags tt ON t.id = tt.tag_id
            LEFT JOIN documentation_tags dt ON t.id = dt.tag_id
            ${whereClause}
            GROUP BY t.id, t.name, t.color, t.description, t.created_by, t.created_at
            ORDER BY total_usage DESC, t.name ASC
            ${limitClause}
          `;

          return await db.unsafe(query, values);
        });

        if (tagsResult.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `**No Tags Found** 🏷️\n\nNo tags match your search criteria.${search ? ` Search: "${search}"` : ' Try creating some tags first.'}`
              }
            ]
          };
        }

        const tagsList = tagsResult.map((tag, index) => {
          const colorDisplay = tag.color ? `${tag.color} ` : '';
          const usageText = tag.total_usage > 0 
            ? `📊 Used ${tag.total_usage} times (${tag.task_count} tasks, ${tag.documentation_count} docs)`
            : '📊 Not yet used';

          return `${index + 1}. ${colorDisplay}**${tag.name}** (ID: ${tag.id})
   📝 ${tag.description || 'No description'}
   ${usageText}
   👤 Created by: ${tag.created_by} | 📅 ${new Date(tag.created_at).toLocaleDateString()}`;
        }).join('\n\n');

        const responseText = `**Tags (${tagsResult.length})** 🏷️

${tagsList}

*Showing ${tagsResult.length} tags (offset: ${offset}, limit: ${limit})*
*Use \`updateTag\` to modify a tag or \`deleteTag\` to remove unused tags.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get tags error:', error);
        return createErrorResponse(`Failed to retrieve tags: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 3: Update Tag
  server.tool(
    "updateTag",
    "Update an existing tag's name, color, or description. Only the tag creator can update it.",
    UpdateTagSchema.shape,
    async ({ id, name, color, description }) => {
      try {
        const updateResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if tag exists and user has permission
          const existingTag = await db`
            SELECT created_by FROM tags WHERE id = ${id}
          `;

          if (existingTag.length === 0) {
            throw new Error(`Tag with ID ${id} not found`);
          }

          // Check permissions (only creator can update)
          if (existingTag[0].created_by !== props.login) {
            throw new Error('You can only update tags you created');
          }

          // Check for name conflicts if updating name
          if (name !== undefined) {
            const nameConflict = await db`
              SELECT id FROM tags WHERE name = ${name} AND id != ${id}
            `;
            if (nameConflict.length > 0) {
              throw new Error(`Tag name "${name}" is already in use`);
            }
          }

          // Build update query dynamically
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            values.push(name);
            paramIndex++;
          }

          if (color !== undefined) {
            updates.push(`color = $${paramIndex}`);
            values.push(color);
            paramIndex++;
          }

          if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            values.push(description);
            paramIndex++;
          }

          if (updates.length === 0) {
            throw new Error('No fields to update');
          }

          // Add tag ID to the end
          values.push(id);

          const query = `
            UPDATE tags 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          const result = await db.unsafe(query, values);
          return result[0];
        });

        const responseText = `**Tag Updated Successfully!** ✅

**Tag ID:** ${updateResult.id}
**Name:** ${updateResult.name}
**Color:** ${updateResult.color || 'Default'}
**Description:** ${updateResult.description || 'No description'}

*The updated tag will be reflected in all tasks and documentation that use it.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Update tag error:', error);
        return createErrorResponse(`Failed to update tag: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 4: Delete Tag
  server.tool(
    "deleteTag",
    "Delete a tag. The tag will be removed from all tasks and documentation. Only the tag creator can delete it.",
    DeleteTagSchema.shape,
    async ({ id }) => {
      try {
        const deleteResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if tag exists and get usage information
          const tagInfo = await db`
            SELECT 
              t.name,
              t.created_by,
              COUNT(DISTINCT tt.task_id) as task_count,
              COUNT(DISTINCT dt.documentation_id) as documentation_count
            FROM tags t
            LEFT JOIN task_tags tt ON t.id = tt.tag_id
            LEFT JOIN documentation_tags dt ON t.id = dt.tag_id
            WHERE t.id = ${id}
            GROUP BY t.id, t.name, t.created_by
          `;

          if (tagInfo.length === 0) {
            throw new Error(`Tag with ID ${id} not found`);
          }

          const tag = tagInfo[0];

          // Check permissions (only creator can delete)
          if (tag.created_by !== props.login) {
            throw new Error('You can only delete tags you created');
          }

          const totalUsage = tag.task_count + tag.documentation_count;
          
          // Delete the tag (relationships will be deleted via CASCADE)
          await db`DELETE FROM tags WHERE id = ${id}`;

          return { 
            tagName: tag.name, 
            taskCount: tag.task_count, 
            documentationCount: tag.documentation_count,
            totalUsage 
          };
        });

        const usageText = deleteResult.totalUsage > 0 
          ? ` The tag was removed from ${deleteResult.taskCount} tasks and ${deleteResult.documentationCount} documentation entries.`
          : '';

        return createSuccessResponse(`Tag "${deleteResult.tagName}" (ID: ${id}) has been deleted successfully.${usageText}`);
      } catch (error) {
        console.error('Delete tag error:', error);
        return createErrorResponse(`Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 5: Get Tag Usage
  server.tool(
    "getTagUsage",
    "Get detailed usage information for a specific tag, including all tasks and documentation that use it.",
    IdSchema.shape,
    async ({ id }) => {
      try {
        const usageResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Get tag info
          const tagInfo = await db`
            SELECT name, description, color, created_by, created_at
            FROM tags WHERE id = ${id}
          `;

          if (tagInfo.length === 0) {
            throw new Error(`Tag with ID ${id} not found`);
          }

          // Get tasks using this tag
          const tasks = await db`
            SELECT t.id, t.title, t.status, t.priority, t.project_name
            FROM tasks t
            JOIN task_tags tt ON t.id = tt.task_id
            WHERE tt.tag_id = ${id}
            ORDER BY t.created_at DESC
          `;

          // Get documentation using this tag
          const documentation = await db`
            SELECT d.id, d.title, d.doc_type, d.project_name, d.importance
            FROM documentation d
            JOIN documentation_tags dt ON d.id = dt.documentation_id
            WHERE dt.tag_id = ${id}
            ORDER BY d.created_at DESC
          `;

          return { tag: tagInfo[0], tasks, documentation };
        });

        const tag = usageResult.tag;
        const tasks = usageResult.tasks;
        const documentation = usageResult.documentation;

        let responseText = `**Tag Usage: ${tag.name}** 🏷️

**Tag Details:**
📝 Description: ${tag.description || 'No description'}
🎨 Color: ${tag.color || 'Default'}
👤 Created by: ${tag.created_by}
📅 Created: ${new Date(tag.created_at).toLocaleDateString()}

**Usage Summary:**
📋 Used in ${tasks.length} tasks
📚 Used in ${documentation.length} documentation entries
📊 Total usage: ${tasks.length + documentation.length}`;

        if (tasks.length > 0) {
          const tasksList = tasks.map(task => {
            const statusEmoji = { 'pending': '⏳', 'in_progress': '🔄', 'completed': '✅', 'cancelled': '❌' }[task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'] || '📝';
            const priorityEmoji = { 'high': '🔴', 'medium': '🟡', 'low': '🟢' }[task.priority as 'high' | 'medium' | 'low'] || '⚪';
            return `   ${statusEmoji} ${priorityEmoji} **${task.title}** (ID: ${task.id}) - ${task.project_name || 'No project'}`;
          }).join('\n');

          responseText += `\n\n**Tasks Using This Tag:**\n${tasksList}`;
        }

        if (documentation.length > 0) {
          const docsList = documentation.map(doc => {
            const typeEmoji = {
              'goals': '🎯', 'why': '💡', 'target_users': '👥',
              'context': '📋', 'requirements': '📝', 'constraints': '⚠️'
            }[doc.doc_type as 'goals' | 'why' | 'target_users' | 'context' | 'requirements' | 'constraints'] || '📄';
            const importanceEmoji = { 'high': '🔴', 'medium': '🟡', 'low': '🟢' }[doc.importance as 'high' | 'medium' | 'low'] || '⚪';
            return `   ${typeEmoji} ${importanceEmoji} **${doc.title}** (ID: ${doc.id}) - ${doc.project_name}`;
          }).join('\n');

          responseText += `\n\n**Documentation Using This Tag:**\n${docsList}`;
        }

        if (tasks.length === 0 && documentation.length === 0) {
          responseText += '\n\n**No Usage Found**\nThis tag is not currently used by any tasks or documentation.';
        }

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get tag usage error:', error);
        return createErrorResponse(`Failed to get tag usage: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 6: Get Popular Tags
  server.tool(
    "getPopularTags",
    "Get the most frequently used tags across all tasks and documentation.",
    {
      limit: GetTagsSchema.shape.limit.optional()
    },
    async ({ limit = 10 }) => {
      try {
        const popularTags = await withDatabase(env.DATABASE_URL, async (db) => {
          return await db`
            SELECT 
              t.id,
              t.name,
              t.color,
              t.description,
              COUNT(DISTINCT tt.task_id) as task_count,
              COUNT(DISTINCT dt.documentation_id) as documentation_count,
              (COUNT(DISTINCT tt.task_id) + COUNT(DISTINCT dt.documentation_id)) as total_usage
            FROM tags t
            LEFT JOIN task_tags tt ON t.id = tt.tag_id
            LEFT JOIN documentation_tags dt ON t.id = dt.tag_id
            GROUP BY t.id, t.name, t.color, t.description
            HAVING (COUNT(DISTINCT tt.task_id) + COUNT(DISTINCT dt.documentation_id)) > 0
            ORDER BY total_usage DESC, t.name ASC
            LIMIT ${limit}
          `;
        });

        if (popularTags.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "**No Tag Usage Found** 🏷️\n\nNo tags are currently being used. Create some tasks or documentation with tags to see usage statistics."
              }
            ]
          };
        }

        const tagsList = popularTags.map((tag, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const colorDisplay = tag.color ? `${tag.color} ` : '';
          return `${medal} ${colorDisplay}**${tag.name}** - ${tag.total_usage} uses
   📋 ${tag.task_count} tasks | 📚 ${tag.documentation_count} docs
   📝 ${tag.description || 'No description'}`;
        }).join('\n\n');

        const responseText = `**Most Popular Tags** 🏆

${tagsList}

*These are the most frequently used tags across all tasks and documentation.*
*Use \`getTagUsage\` with a specific tag ID to see detailed usage information.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get popular tags error:', error);
        return createErrorResponse(`Failed to get popular tags: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}