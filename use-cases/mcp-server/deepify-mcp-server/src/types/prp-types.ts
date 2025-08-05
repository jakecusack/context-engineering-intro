/**
 * TypeScript type definitions for PRP parsing and task management
 */

import { z } from 'zod';

// ============================================================================
// Core PRP Parsing Types
// ============================================================================

export interface ExtractedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  dependencies?: string[];
  tags?: string[];
}

export interface ExtractedDocumentation {
  type: 'goals' | 'why' | 'target_users' | 'context' | 'requirements' | 'constraints';
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ProjectContext {
  projectName: string;
  description: string;
  targetUsers: string[];
  goals: string[];
  constraints: string[];
}

export interface PRPMetadata {
  totalEstimatedHours: number;
  highPriorityTasks: number;
  complexityLevel: 'low' | 'medium' | 'high';
  suggestedTags: string[];
  parsingTimestamp?: string;
  taskCount?: number;
  documentationCount?: number;
}

export interface PRPParsingResult {
  tasks: ExtractedTask[];
  documentation: ExtractedDocumentation[];
  projectContext: ProjectContext;
  metadata: PRPMetadata;
}

export interface PRPParsingOptions {
  projectContext?: Partial<ProjectContext>;
  maxTasks?: number;
  includeMetadata?: boolean;
}

// ============================================================================
// Database Entity Types
// ============================================================================

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  project_name?: string;
  prp_source?: string;
  assigned_to?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
  completion_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
}

export interface Documentation {
  id: number;
  project_name: string;
  doc_type: 'goals' | 'why' | 'target_users' | 'context' | 'requirements' | 'constraints';
  title: string;
  content: string;
  prp_source?: string;
  importance: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  description?: string;
  created_by: string;
  created_at: Date;
}

export interface TaskTag {
  task_id: number;
  tag_id: number;
}

export interface DocumentationTag {
  documentation_id: number;
  tag_id: number;
}

export interface PRPParsingHistory {
  id: number;
  prp_content: string;
  extracted_data: any; // JSONB
  parsing_model: string;
  parsing_timestamp: Date;
  parsed_by: string;
  status: 'success' | 'error' | 'partial';
  error_message?: string;
  project_name?: string;
}

export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  dependency_type: 'blocks' | 'related' | 'subtask';
  created_at: Date;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

// PRP Parsing Schemas
export const ParsePRPSchema = z.object({
  prpContent: z.string().min(10, "PRP content must be at least 10 characters"),
  projectName: z.string().min(1, "Project name is required").optional(),
  projectContext: z.object({
    projectName: z.string().optional(),
    description: z.string().optional(),
    targetUsers: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional()
  }).optional()
});

// Task Management Schemas
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  projectName: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().int().min(0).max(1000).optional(),
  assignedTo: z.string().max(255).optional(),
  prpSource: z.string().max(255).optional()
});

export const UpdateTaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedTo: z.string().max(255).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().int().min(0).max(1000).optional(),
  actualHours: z.number().int().min(0).max(1000).optional(),
  completionDate: z.string().datetime().optional()
});

export const GetTasksSchema = z.object({
  projectName: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'due_date', 'priority', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const DeleteTaskSchema = z.object({
  id: z.number().int().positive()
});

// Documentation Management Schemas
export const CreateDocumentationSchema = z.object({
  projectName: z.string().min(1, "Project name is required").max(255),
  docType: z.enum(['goals', 'why', 'target_users', 'context', 'requirements', 'constraints']),
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  importance: z.enum(['low', 'medium', 'high']).default('medium'),
  prpSource: z.string().max(255).optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateDocumentationSchema = z.object({
  id: z.number().int().positive(),
  projectName: z.string().min(1).max(255).optional(),
  docType: z.enum(['goals', 'why', 'target_users', 'context', 'requirements', 'constraints']).optional(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  importance: z.enum(['low', 'medium', 'high']).optional()
});

export const GetDocumentationSchema = z.object({
  projectName: z.string().optional(),
  docType: z.enum(['goals', 'why', 'target_users', 'context', 'requirements', 'constraints']).optional(),
  importance: z.enum(['low', 'medium', 'high']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const DeleteDocumentationSchema = z.object({
  id: z.number().int().positive()
});

// Tag Management Schemas
export const CreateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(100, "Tag name too long"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color").optional(),
  description: z.string().optional()
});

export const UpdateTagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color").optional(),
  description: z.string().optional()
});

export const GetTagsSchema = z.object({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

export const DeleteTagSchema = z.object({
  id: z.number().int().positive()
});

export const AssignTagsSchema = z.object({
  entityType: z.enum(['task', 'documentation']),
  entityId: z.number().int().positive(),
  tagIds: z.array(z.number().int().positive())
});

// Utility Schemas
export const IdSchema = z.object({
  id: z.number().int().positive()
});

export const ProjectNameSchema = z.object({
  projectName: z.string().min(1, "Project name is required").max(255)
});

// ============================================================================
// Response Types
// ============================================================================

export interface TaskWithTags extends Task {
  tag_names?: string;
  tags?: Tag[];
}

export interface DocumentationWithTags extends Documentation {
  tag_names?: string;
  tags?: Tag[];
}

export interface PRPParsingResponse {
  success: boolean;
  result?: PRPParsingResult;
  parsingHistoryId?: number;
  error?: string;
}

export interface TaskResponse {
  success: boolean;
  task?: TaskWithTags;
  error?: string;
}

export interface TaskListResponse {
  success: boolean;
  tasks?: TaskWithTags[];
  total?: number;
  offset?: number;
  limit?: number;
  error?: string;
}

export interface DocumentationResponse {
  success: boolean;
  documentation?: DocumentationWithTags;
  error?: string;
}

export interface DocumentationListResponse {
  success: boolean;
  documentation?: DocumentationWithTags[];
  total?: number;
  offset?: number;
  limit?: number;
  error?: string;
}

export interface TagResponse {
  success: boolean;
  tag?: Tag;
  error?: string;
}

export interface TagListResponse {
  success: boolean;
  tags?: Tag[];
  total?: number;
  offset?: number;
  limit?: number;
  error?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidTaskStatus(status: any): status is Task['status'] {
  return ['pending', 'in_progress', 'completed', 'cancelled'].includes(status);
}

export function isValidPriority(priority: any): priority is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(priority);
}

export function isValidDocumentationType(type: any): type is Documentation['doc_type'] {
  return ['goals', 'why', 'target_users', 'context', 'requirements', 'constraints'].includes(type);
}

export function isValidImportance(importance: any): importance is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(importance);
}

// ============================================================================
// Utility Types
// ============================================================================

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type GetTasksInput = z.infer<typeof GetTasksSchema>;

export type CreateDocumentationInput = z.infer<typeof CreateDocumentationSchema>;
export type UpdateDocumentationInput = z.infer<typeof UpdateDocumentationSchema>;
export type GetDocumentationInput = z.infer<typeof GetDocumentationSchema>;

export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;
export type GetTagsInput = z.infer<typeof GetTagsSchema>;

export type ParsePRPInput = z.infer<typeof ParsePRPSchema>;