/**
 * Additional task-specific types and utilities
 */

export interface TaskStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export interface ProjectStatistics {
  projectName: string;
  taskCount: number;
  completedTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  documentationCount: number;
  tags: string[];
}

export interface TaskDependencyGraph {
  taskId: number;
  title: string;
  dependencies: TaskDependencyNode[];
  dependents: TaskDependencyNode[];
}

export interface TaskDependencyNode {
  taskId: number;
  title: string;
  dependencyType: 'blocks' | 'related' | 'subtask';
}

export interface TaskFilter {
  projectName?: string;
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  hasEstimate?: boolean;
  overdue?: boolean;
}

export interface TaskSort {
  field: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title' | 'estimated_hours';
  order: 'asc' | 'desc';
}

export interface TaskBulkOperation {
  taskIds: number[];
  operation: 'update_status' | 'assign_user' | 'add_tags' | 'remove_tags' | 'delete';
  value?: any;
}

export interface TaskTimeEntry {
  id: number;
  taskId: number;
  hoursWorked: number;
  description?: string;
  workDate: Date;
  createdBy: string;
  createdAt: Date;
}