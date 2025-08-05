/**
 * Task Management Tools for MCP Server
 * 
 * Complete CRUD operations for tasks with tag management, filtering, and statistics.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props, Env, createErrorResponse, createSuccessResponse } from "../types";
import { 
  CreateTaskSchema, 
  UpdateTaskSchema, 
  GetTasksSchema, 
  DeleteTaskSchema,
  AssignTagsSchema,
  IdSchema,
  ProjectNameSchema,
  CreateTaskInput,
  UpdateTaskInput,
  GetTasksInput,
  TaskWithTags
} from "../types/prp-types";
import { withDatabase } from "../database/utils";
import { validateSqlQuery, isWriteOperation } from "../database/security";

// Users with write access to tasks
const WRITE_ACCESS_USERS = new Set<string>([
  'coleam00', // Add your GitHub username
  // Add other users with write access
]);

export function registerTaskManagementTools(server: McpServer, env: Env, props: Props) {
  
  // Tool 1: Create Task - Available to all authenticated users
  server.tool(
    "createTask",
    "Create a new task with optional tag assignment. Can be used to store tasks extracted from PRP parsing or create manual tasks.",
    CreateTaskSchema.shape,
    async ({ title, description, priority, projectName, tags, dueDate, estimatedHours, assignedTo, prpSource }) => {
      try {
        const taskResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Insert the task
          const taskInsert = await db`
            INSERT INTO tasks (
              title, 
              description, 
              priority, 
              project_name, 
              due_date,
              estimated_hours,
              assigned_to,
              prp_source,
              created_by
            )
            VALUES (
              ${title}, 
              ${description || null}, 
              ${priority}, 
              ${projectName || null}, 
              ${dueDate ? new Date(dueDate) : null},
              ${estimatedHours || null},
              ${assignedTo || null},
              ${prpSource || null},
              ${props.login}
            )
            RETURNING *
          `;

          const task = taskInsert[0];

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

              // Assign tag to task
              await db`
                INSERT INTO task_tags (task_id, tag_id)
                VALUES (${task.id}, ${tagId})
                ON CONFLICT DO NOTHING
              `;
            }
          }

          // Return task with tags
          const taskWithTags = await db`
            SELECT 
              t.*,
              string_agg(tags.name, ', ') as tag_names
            FROM tasks t
            LEFT JOIN task_tags tt ON t.id = tt.task_id
            LEFT JOIN tags ON tt.tag_id = tags.id
            WHERE t.id = ${task.id}
            GROUP BY t.id
          `;

          return taskWithTags[0];
        });

        const responseText = `**Task Created Successfully!** ✅

**Task ID:** ${taskResult.id}
**Title:** ${taskResult.title}
**Priority:** ${taskResult.priority}
**Status:** ${taskResult.status}
**Project:** ${taskResult.project_name || 'None'}
**Assigned To:** ${taskResult.assigned_to || 'Unassigned'}
**Estimated Hours:** ${taskResult.estimated_hours || 'Not specified'}
**Due Date:** ${taskResult.due_date ? new Date(taskResult.due_date).toLocaleDateString() : 'Not set'}
**Tags:** ${taskResult.tag_names || 'None'}
**Created By:** ${taskResult.created_by}

*Use \`getTasks\` to view all tasks or \`updateTask\` to modify this task.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Create task error:', error);
        return createErrorResponse(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 2: Get Tasks - Available to all authenticated users
  server.tool(
    "getTasks",
    "Retrieve tasks with filtering options. Supports pagination, filtering by project, status, assignee, and tags.",
    GetTasksSchema.shape,
    async ({ projectName, status, assignedTo, priority, tags, limit, offset, sortBy, sortOrder }) => {
      try {
        const tasksResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Build WHERE clause dynamically
          const conditions: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (projectName) {
            conditions.push(`t.project_name = $${paramIndex}`);
            values.push(projectName);
            paramIndex++;
          }

          if (status) {
            conditions.push(`t.status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
          }

          if (assignedTo) {
            conditions.push(`t.assigned_to = $${paramIndex}`);
            values.push(assignedTo);
            paramIndex++;
          }

          if (priority) {
            conditions.push(`t.priority = $${paramIndex}`);
            values.push(priority);
            paramIndex++;
          }

          const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
          
          // Handle tag filtering separately
          let havingClause = '';
          if (tags && tags.length > 0) {
            const tagConditions = tags.map((tag: string, index: number) => {
              values.push(tag);
              return `$${paramIndex + index}`;
            });
            havingClause = `HAVING string_agg(tags.name, ', ') ILIKE ANY(ARRAY[${tagConditions.map((t: string) => `'%' || ${t} || '%'`).join(', ')}])`;
            paramIndex += tags.length;
          }

          // Build ORDER BY clause
          const validSortColumns = {
            'created_at': 't.created_at',
            'updated_at': 't.updated_at',
            'due_date': 't.due_date',
            'priority': `CASE t.priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 END`,
            'title': 't.title'
          };
          
          const sortColumn = validSortColumns[sortBy as keyof typeof validSortColumns] || 't.created_at';
          const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
          
          // Add limit and offset
          values.push(limit, offset);
          const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

          const query = `
            SELECT 
              t.id,
              t.title,
              t.description,
              t.status,
              t.priority,
              t.project_name,
              t.assigned_to,
              t.created_by,
              t.created_at,
              t.updated_at,
              t.due_date,
              t.estimated_hours,
              t.actual_hours,
              string_agg(tags.name, ', ') as tag_names
            FROM tasks t
            LEFT JOIN task_tags tt ON t.id = tt.task_id
            LEFT JOIN tags ON tt.tag_id = tags.id
            ${whereClause}
            GROUP BY t.id, t.title, t.description, t.status, t.priority, t.project_name, 
                     t.assigned_to, t.created_by, t.created_at, t.updated_at, t.due_date,
                     t.estimated_hours, t.actual_hours
            ${havingClause}
            ${orderClause}
            ${limitClause}
          `;

          return await db.unsafe(query, values);
        });

        if (tasksResult.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `**No Tasks Found** 📝\n\nNo tasks match your filter criteria.${projectName ? ` Project: ${projectName}` : ''}${status ? ` Status: ${status}` : ''}`
              }
            ]
          };
        }

        const tasksList = tasksResult.map((task, index) => {
          const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set';
          const statusEmoji = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'cancelled': '❌'
          }[task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'] || '📝';

          const priorityEmoji = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
          }[task.priority as 'high' | 'medium' | 'low'] || '⚪';

          return `${index + 1}. ${statusEmoji} **${task.title}** (ID: ${task.id})
   ${priorityEmoji} Priority: ${task.priority} | Status: ${task.status}
   📂 Project: ${task.project_name || 'None'} | 👤 Assigned: ${task.assigned_to || 'Unassigned'}
   ⏰ Due: ${dueDate} | 🕐 Est. Hours: ${task.estimated_hours || 'Not specified'}
   🏷️ Tags: ${task.tag_names || 'None'}
   📝 ${task.description ? task.description.substring(0, 100) + (task.description.length > 100 ? '...' : '') : 'No description'}`;
        }).join('\n\n');

        const responseText = `**Tasks (${tasksResult.length})** 📋

${tasksList}

*Showing ${tasksResult.length} tasks (offset: ${offset}, limit: ${limit})*
*Use \`updateTask\` to modify a task or \`deleteTask\` to remove one.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get tasks error:', error);
        return createErrorResponse(`Failed to retrieve tasks: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 3: Update Task - Available to all authenticated users (own tasks) or privileged users (any task)
  server.tool(
    "updateTask",
    "Update an existing task. Users can update their own tasks, or privileged users can update any task.",
    UpdateTaskSchema.shape,
    async ({ id, title, description, status, priority, assignedTo, dueDate, estimatedHours, actualHours, completionDate }) => {
      try {
        const updateResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if task exists and user has permission
          const existingTask = await db`
            SELECT created_by FROM tasks WHERE id = ${id}
          `;

          if (existingTask.length === 0) {
            throw new Error(`Task with ID ${id} not found`);
          }

          // Check permissions - user can edit their own tasks, or privileged users can edit any
          const canEdit = existingTask[0].created_by === props.login || WRITE_ACCESS_USERS.has(props.login);
          if (!canEdit) {
            throw new Error('You can only update tasks you created, unless you have privileged access');
          }

          // Build update query dynamically
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            values.push(title);
            paramIndex++;
          }

          if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            values.push(description);
            paramIndex++;
          }

          if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;

            // Auto-set completion date if status is completed
            if (status === 'completed' && !completionDate) {
              updates.push(`completion_date = $${paramIndex}`);
              values.push(new Date());
              paramIndex++;
            }
          }

          if (priority !== undefined) {
            updates.push(`priority = $${paramIndex}`);
            values.push(priority);
            paramIndex++;
          }

          if (assignedTo !== undefined) {
            updates.push(`assigned_to = $${paramIndex}`);
            values.push(assignedTo);
            paramIndex++;
          }

          if (dueDate !== undefined) {
            updates.push(`due_date = $${paramIndex}`);
            values.push(dueDate ? new Date(dueDate) : null);
            paramIndex++;
          }

          if (estimatedHours !== undefined) {
            updates.push(`estimated_hours = $${paramIndex}`);
            values.push(estimatedHours);
            paramIndex++;
          }

          if (actualHours !== undefined) {
            updates.push(`actual_hours = $${paramIndex}`);
            values.push(actualHours);
            paramIndex++;
          }

          if (completionDate !== undefined) {
            updates.push(`completion_date = $${paramIndex}`);
            values.push(completionDate ? new Date(completionDate) : null);
            paramIndex++;
          }

          if (updates.length === 0) {
            throw new Error('No fields to update');
          }

          // Always update the updated_at timestamp
          updates.push(`updated_at = $${paramIndex}`);
          values.push(new Date());
          paramIndex++;

          // Add task ID to the end
          values.push(id);

          const query = `
            UPDATE tasks 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          const result = await db.unsafe(query, values);
          
          // Get task with tags
          const taskWithTags = await db`
            SELECT 
              t.*,
              string_agg(tags.name, ', ') as tag_names
            FROM tasks t
            LEFT JOIN task_tags tt ON t.id = tt.task_id
            LEFT JOIN tags ON tt.tag_id = tags.id
            WHERE t.id = ${id}
            GROUP BY t.id
          `;

          return taskWithTags[0];
        });

        const responseText = `**Task Updated Successfully!** ✅

**Task ID:** ${updateResult.id}
**Title:** ${updateResult.title}
**Priority:** ${updateResult.priority}
**Status:** ${updateResult.status}
**Project:** ${updateResult.project_name || 'None'}
**Assigned To:** ${updateResult.assigned_to || 'Unassigned'}
**Estimated Hours:** ${updateResult.estimated_hours || 'Not specified'}
**Actual Hours:** ${updateResult.actual_hours || 'Not specified'}
**Due Date:** ${updateResult.due_date ? new Date(updateResult.due_date).toLocaleDateString() : 'Not set'}
**Completion Date:** ${updateResult.completion_date ? new Date(updateResult.completion_date).toLocaleDateString() : 'Not completed'}
**Tags:** ${updateResult.tag_names || 'None'}
**Last Updated:** ${new Date(updateResult.updated_at).toLocaleString()}

*Use \`getTasks\` to view the updated task in context.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Update task error:', error);
        return createErrorResponse(`Failed to update task: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 4: Delete Task - Available to task creators or privileged users
  server.tool(
    "deleteTask",
    "Delete a task. Users can delete their own tasks, or privileged users can delete any task. This action cannot be undone.",
    DeleteTaskSchema.shape,
    async ({ id }) => {
      try {
        const deleteResult = await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if task exists and user has permission
          const existingTask = await db`
            SELECT created_by, title FROM tasks WHERE id = ${id}
          `;

          if (existingTask.length === 0) {
            throw new Error(`Task with ID ${id} not found`);
          }

          // Check permissions
          const canDelete = existingTask[0].created_by === props.login || WRITE_ACCESS_USERS.has(props.login);
          if (!canDelete) {
            throw new Error('You can only delete tasks you created, unless you have privileged access');
          }

          const taskTitle = existingTask[0].title;

          // Delete the task (tags and dependencies will be deleted via CASCADE)
          await db`DELETE FROM tasks WHERE id = ${id}`;

          return { taskTitle };
        });

        return createSuccessResponse(`Task "${deleteResult.taskTitle}" (ID: ${id}) has been deleted successfully.`);
      } catch (error) {
        console.error('Delete task error:', error);
        return createErrorResponse(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 5: Assign Tags to Task
  server.tool(
    "assignTagsToTask",
    "Assign one or more tags to a task. Creates tags if they don't exist.",
    {
      taskId: IdSchema.shape.id,
      tagNames: CreateTaskSchema.shape.tags
    },
    async ({ taskId, tagNames }) => {
      try {
        if (!tagNames || tagNames.length === 0) {
          return createErrorResponse('At least one tag name is required');
        }

        await withDatabase(env.DATABASE_URL, async (db) => {
          // Check if task exists
          const task = await db`SELECT id, title FROM tasks WHERE id = ${taskId}`;
          if (task.length === 0) {
            throw new Error(`Task with ID ${taskId} not found`);
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

            // Assign tag to task
            await db`
              INSERT INTO task_tags (task_id, tag_id)
              VALUES (${taskId}, ${tagId})
              ON CONFLICT DO NOTHING
            `;
          }
        });

        return createSuccessResponse(`Tags "${tagNames.join(', ')}" assigned to task ${taskId}.`);
      } catch (error) {
        console.error('Assign tags error:', error);
        return createErrorResponse(`Failed to assign tags: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Tool 6: Get Task Statistics
  server.tool(
    "getTaskStatistics",
    "Get statistics for tasks, optionally filtered by project. Shows task counts by status, priority, and other metrics.",
    {
      projectName: ProjectNameSchema.shape.projectName.optional()
    },
    async ({ projectName }) => {
      try {
        const statsResult = await withDatabase(env.DATABASE_URL, async (db) => {
          const whereClause = projectName ? `WHERE project_name = '${projectName}'` : '';
          
          const stats = await db.unsafe(`
            SELECT 
              COUNT(*) as total_tasks,
              COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
              COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks,
              COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks,
              COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_tasks,
              COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_tasks,
              COUNT(CASE WHEN due_date < NOW() AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_tasks,
              SUM(estimated_hours) as total_estimated_hours,
              SUM(actual_hours) as total_actual_hours,
              AVG(estimated_hours) as avg_estimated_hours
            FROM tasks 
            ${whereClause}
          `);

          return stats[0];
        });

        const completionRate = statsResult.total_tasks > 0 
          ? ((statsResult.completed_tasks / statsResult.total_tasks) * 100).toFixed(1)
          : '0';

        const responseText = `**Task Statistics** 📊${projectName ? ` - ${projectName}` : ''}

**Overall Metrics:**
📝 Total Tasks: ${statsResult.total_tasks}
✅ Completion Rate: ${completionRate}%
⚠️ Overdue Tasks: ${statsResult.overdue_tasks}

**By Status:**
⏳ Pending: ${statsResult.pending_tasks}
🔄 In Progress: ${statsResult.in_progress_tasks}
✅ Completed: ${statsResult.completed_tasks}
❌ Cancelled: ${statsResult.cancelled_tasks}

**By Priority:**
🔴 High: ${statsResult.high_priority_tasks}
🟡 Medium: ${statsResult.medium_priority_tasks}
🟢 Low: ${statsResult.low_priority_tasks}

**Time Tracking:**
🕐 Total Estimated Hours: ${statsResult.total_estimated_hours || 0}
⏰ Total Actual Hours: ${statsResult.total_actual_hours || 0}
📊 Average Estimated Hours: ${statsResult.avg_estimated_hours ? Number(statsResult.avg_estimated_hours).toFixed(1) : 0}

*Use \`getTasks\` with filters to explore specific task categories.*`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        console.error('Get task statistics error:', error);
        return createErrorResponse(`Failed to get task statistics: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}