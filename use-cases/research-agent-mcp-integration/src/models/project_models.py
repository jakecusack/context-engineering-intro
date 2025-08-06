"""
Pydantic models for project management data structures
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DocumentationType(str, Enum):
    """Documentation type enumeration"""
    GUIDE = "guide"
    REFERENCE = "reference"
    API = "api"
    TUTORIAL = "tutorial"
    SPEC = "spec"
    README = "readme"
    CHANGELOG = "changelog"


class DocumentationImportance(str, Enum):
    """Documentation importance enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(BaseModel):
    """Task data model"""
    id: Optional[int] = Field(None, description="Task ID (set by database)")
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description")
    project_name: str = Field(..., description="Project name")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    estimated_hours: Optional[int] = Field(None, ge=0, description="Estimated hours to complete")
    actual_hours: Optional[int] = Field(None, ge=0, description="Actual hours spent")
    assigned_to: Optional[str] = Field(None, description="GitHub username assigned to task")
    created_by: str = Field(..., description="GitHub username who created the task")
    due_date: Optional[datetime] = Field(None, description="Task due date")
    completed_at: Optional[datetime] = Field(None, description="Task completion timestamp")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    tags: List[str] = Field(default_factory=list, description="Task tags")
    dependencies: List[int] = Field(default_factory=list, description="Task IDs this task depends on")


class Documentation(BaseModel):
    """Documentation data model"""
    id: Optional[int] = Field(None, description="Documentation ID (set by database)")
    title: str = Field(..., description="Documentation title")
    content: str = Field(..., description="Documentation content (Markdown)")
    type: DocumentationType = Field(..., description="Documentation type")
    project_name: str = Field(..., description="Project name")
    importance: DocumentationImportance = Field(
        default=DocumentationImportance.MEDIUM, 
        description="Documentation importance"
    )
    created_by: str = Field(..., description="GitHub username who created the documentation")
    version: str = Field(default="1.0", description="Documentation version")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    tags: List[str] = Field(default_factory=list, description="Documentation tags")


class Tag(BaseModel):
    """Tag data model"""
    id: Optional[int] = Field(None, description="Tag ID (set by database)")
    name: str = Field(..., description="Tag name")
    description: Optional[str] = Field(None, description="Tag description")
    color: Optional[str] = Field(None, description="Tag color (hex code)")
    created_by: str = Field(..., description="GitHub username who created the tag")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")


class ProjectSummary(BaseModel):
    """Summary of a project's current state"""
    project_name: str = Field(..., description="Project name")
    total_tasks: int = Field(..., description="Total number of tasks")
    completed_tasks: int = Field(..., description="Number of completed tasks")
    in_progress_tasks: int = Field(..., description="Number of in-progress tasks")
    blocked_tasks: int = Field(..., description="Number of blocked tasks")
    total_estimated_hours: int = Field(default=0, description="Total estimated hours")
    total_actual_hours: int = Field(default=0, description="Total actual hours spent")
    completion_percentage: float = Field(default=0.0, description="Project completion percentage")
    documentation_count: int = Field(default=0, description="Number of documentation entries")
    unique_assignees: int = Field(default=0, description="Number of unique assignees")
    created_at: Optional[datetime] = Field(None, description="Project creation date")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")


class ProjectMetrics(BaseModel):
    """Detailed project metrics"""
    summary: ProjectSummary = Field(..., description="Project summary")
    task_distribution: Dict[str, int] = Field(default_factory=dict, description="Tasks by status")
    priority_distribution: Dict[str, int] = Field(default_factory=dict, description="Tasks by priority")
    assignee_workload: Dict[str, int] = Field(default_factory=dict, description="Tasks per assignee")
    documentation_types: Dict[str, int] = Field(default_factory=dict, description="Documentation by type")
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list, description="Recent project activity")
    velocity_metrics: Dict[str, float] = Field(default_factory=dict, description="Project velocity metrics")


class CreateTaskRequest(BaseModel):
    """Request to create a new task"""
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description")
    project_name: str = Field(..., description="Project name")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    estimated_hours: Optional[int] = Field(None, ge=0, description="Estimated hours")
    assigned_to: Optional[str] = Field(None, description="Assignee GitHub username")
    due_date: Optional[datetime] = Field(None, description="Due date")
    tags: List[str] = Field(default_factory=list, description="Task tags")


class CreateDocumentationRequest(BaseModel):
    """Request to create new documentation"""
    title: str = Field(..., description="Documentation title")
    content: str = Field(..., description="Documentation content")
    type: DocumentationType = Field(..., description="Documentation type")
    project_name: str = Field(..., description="Project name")
    importance: DocumentationImportance = Field(
        default=DocumentationImportance.MEDIUM,
        description="Documentation importance"
    )
    tags: List[str] = Field(default_factory=list, description="Documentation tags")


class PRPParsingResult(BaseModel):
    """Result from PRP parsing via MCP server"""
    success: bool = Field(..., description="Whether parsing was successful")
    project_name: str = Field(..., description="Extracted project name")
    tasks_extracted: int = Field(..., description="Number of tasks extracted")
    documentation_extracted: int = Field(..., description="Number of documentation sections extracted")
    total_estimated_hours: int = Field(default=0, description="Total estimated hours")
    complexity_level: str = Field(..., description="Project complexity level")
    suggested_tags: List[str] = Field(default_factory=list, description="Suggested project tags")
    parsing_history_id: Optional[int] = Field(None, description="MCP parsing history ID")
    error_message: Optional[str] = Field(None, description="Error message if parsing failed")