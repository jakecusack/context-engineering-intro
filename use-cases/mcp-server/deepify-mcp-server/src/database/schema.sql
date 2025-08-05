-- Deepify MCP Server Database Schema
-- Schema for PRP parsing, task management, and documentation storage

-- Tasks table for storing extracted and manual tasks
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    project_name VARCHAR(255),
    prp_source VARCHAR(255), -- Reference to source PRP
    assigned_to VARCHAR(255), -- GitHub username
    created_by VARCHAR(255) NOT NULL, -- GitHub username
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    completion_date TIMESTAMP,
    estimated_hours INTEGER,
    actual_hours INTEGER
);

-- Documentation table for storing PRP-derived project context
CREATE TABLE IF NOT EXISTS documentation (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL CHECK (doc_type IN ('goals', 'why', 'target_users', 'context', 'requirements', 'constraints')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    prp_source VARCHAR(255), -- Reference to source PRP
    importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table for task and documentation organization
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7), -- Hex color code like #FF5733
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task-tag relationship table
CREATE TABLE IF NOT EXISTS task_tags (
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- Documentation-tag relationship table
CREATE TABLE IF NOT EXISTS documentation_tags (
    documentation_id INTEGER REFERENCES documentation(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (documentation_id, tag_id)
);

-- PRP parsing history for tracking and auditing
CREATE TABLE IF NOT EXISTS prp_parsing_history (
    id SERIAL PRIMARY KEY,
    prp_content TEXT NOT NULL,
    extracted_data JSONB, -- Structured data extracted by Claude
    parsing_model VARCHAR(100), -- Claude model used
    parsing_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parsed_by VARCHAR(255) NOT NULL, -- GitHub username
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'partial')),
    error_message TEXT, -- Store error details if parsing failed
    project_name VARCHAR(255) -- Associated project if specified
);

-- Task dependencies table for managing task relationships
CREATE TABLE IF NOT EXISTS task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'related', 'subtask')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_name ON tasks(project_name);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_documentation_project_name ON documentation(project_name);
CREATE INDEX IF NOT EXISTS idx_documentation_doc_type ON documentation(doc_type);
CREATE INDEX IF NOT EXISTS idx_documentation_created_by ON documentation(created_by);

CREATE INDEX IF NOT EXISTS idx_prp_parsing_history_parsed_by ON prp_parsing_history(parsed_by);
CREATE INDEX IF NOT EXISTS idx_prp_parsing_history_timestamp ON prp_parsing_history(parsing_timestamp);
CREATE INDEX IF NOT EXISTS idx_prp_parsing_history_project_name ON prp_parsing_history(project_name);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentation_updated_at BEFORE UPDATE ON documentation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags for common use cases
INSERT INTO tags (name, color, description, created_by) VALUES
    ('frontend', '#3B82F6', 'Frontend development tasks', 'system'),
    ('backend', '#10B981', 'Backend development tasks', 'system'),
    ('database', '#8B5CF6', 'Database-related tasks', 'system'),
    ('testing', '#F59E0B', 'Testing and QA tasks', 'system'),
    ('deployment', '#EF4444', 'Deployment and DevOps tasks', 'system'),
    ('documentation', '#6B7280', 'Documentation tasks', 'system'),
    ('urgent', '#DC2626', 'High priority urgent tasks', 'system'),
    ('research', '#06B6D4', 'Research and investigation tasks', 'system')
ON CONFLICT (name) DO NOTHING;

-- Create a view for task summary with tag information
CREATE OR REPLACE VIEW task_summary AS
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
    COALESCE(string_agg(tags.name, ', '), '') as tag_names,
    COUNT(deps.depends_on_task_id) as dependency_count
FROM tasks t
LEFT JOIN task_tags tt ON t.id = tt.task_id
LEFT JOIN tags ON tt.tag_id = tags.id
LEFT JOIN task_dependencies deps ON t.id = deps.task_id
GROUP BY t.id, t.title, t.description, t.status, t.priority, t.project_name, 
         t.assigned_to, t.created_by, t.created_at, t.updated_at, t.due_date, t.estimated_hours;

-- Create a view for documentation with tag information
CREATE OR REPLACE VIEW documentation_summary AS
SELECT 
    d.id,
    d.project_name,
    d.doc_type,
    d.title,
    d.content,
    d.importance,
    d.created_by,
    d.created_at,
    d.updated_at,
    COALESCE(string_agg(tags.name, ', '), '') as tag_names
FROM documentation d
LEFT JOIN documentation_tags dt ON d.id = dt.documentation_id
LEFT JOIN tags ON dt.tag_id = tags.id
GROUP BY d.id, d.project_name, d.doc_type, d.title, d.content, d.importance, 
         d.created_by, d.created_at, d.updated_at;