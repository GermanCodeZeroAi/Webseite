-- GermanCodeZero-Agent PostgreSQL Initialization Script

-- Create schemas
CREATE SCHEMA IF NOT EXISTS agents;
CREATE SCHEMA IF NOT EXISTS workflows;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
SET search_path TO agents, workflows, audit, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents schema tables
CREATE TABLE IF NOT EXISTS agents.agent_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 5),
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    CONSTRAINT agent_type_check CHECK (agent_type IN ('NANO', 'MIKRO', 'SUB', 'DOMAIN', 'ENTERPRISE'))
);

-- Agent relationships
CREATE TABLE IF NOT EXISTS agents.agent_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_agent_id UUID NOT NULL,
    child_agent_id UUID NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (parent_agent_id) REFERENCES agents.agent_registry(id) ON DELETE CASCADE,
    FOREIGN KEY (child_agent_id) REFERENCES agents.agent_registry(id) ON DELETE CASCADE,
    UNIQUE(parent_agent_id, child_agent_id)
);

-- Agent executions
CREATE TABLE IF NOT EXISTS agents.agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (agent_id) REFERENCES agents.agent_registry(id),
    CONSTRAINT status_check CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled'))
);

-- Workflows schema tables
CREATE TABLE IF NOT EXISTS workflows.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50) NOT NULL,
    definition JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}'
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflows.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    context JSONB DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflows.workflow_definitions(id)
);

-- Audit schema tables
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Compliance log
CREATE TABLE IF NOT EXISTS audit.compliance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    compliance_type VARCHAR(50) NOT NULL,
    agent_id UUID,
    request_id VARCHAR(100),
    violation_type VARCHAR(100),
    violation_details JSONB,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    FOREIGN KEY (agent_id) REFERENCES agents.agent_registry(id)
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS audit.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agent_id UUID NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    unit VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (agent_id) REFERENCES agents.agent_registry(id)
);

-- Create indexes
CREATE INDEX idx_agent_registry_type ON agents.agent_registry(agent_type);
CREATE INDEX idx_agent_registry_tags ON agents.agent_registry USING GIN(tags);
CREATE INDEX idx_agent_registry_metadata ON agents.agent_registry USING GIN(metadata);
CREATE INDEX idx_agent_executions_status ON agents.agent_executions(status);
CREATE INDEX idx_agent_executions_agent_id ON agents.agent_executions(agent_id);
CREATE INDEX idx_audit_log_timestamp ON audit.audit_log(timestamp);
CREATE INDEX idx_audit_log_user_id ON audit.audit_log(user_id);
CREATE INDEX idx_compliance_log_timestamp ON audit.compliance_log(timestamp);
CREATE INDEX idx_performance_metrics_timestamp ON audit.performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_agent_id ON audit.performance_metrics(agent_id);

-- Create views
CREATE OR REPLACE VIEW agents.agent_hierarchy AS
SELECT 
    a.id,
    a.name,
    a.agent_type,
    a.hierarchy_level,
    ar.parent_agent_id,
    p.name as parent_name,
    p.agent_type as parent_type
FROM agents.agent_registry a
LEFT JOIN agents.agent_relationships ar ON a.id = ar.child_agent_id
LEFT JOIN agents.agent_registry p ON ar.parent_agent_id = p.id
WHERE a.is_active = true;

CREATE OR REPLACE VIEW agents.agent_performance_summary AS
SELECT 
    a.id,
    a.name,
    a.agent_type,
    COUNT(DISTINCT ae.id) as total_executions,
    COUNT(DISTINCT CASE WHEN ae.status = 'success' THEN ae.id END) as successful_executions,
    COUNT(DISTINCT CASE WHEN ae.status = 'failed' THEN ae.id END) as failed_executions,
    AVG(ae.execution_time_ms) as avg_execution_time_ms,
    MAX(ae.completed_at) as last_execution
FROM agents.agent_registry a
LEFT JOIN agents.agent_executions ae ON a.id = ae.agent_id
GROUP BY a.id, a.name, a.agent_type;

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_agent_registry_updated_at BEFORE UPDATE
    ON agents.agent_registry FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_definitions_updated_at BEFORE UPDATE
    ON workflows.workflow_definitions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON SCHEMA agents TO gcz_agent;
GRANT ALL PRIVILEGES ON SCHEMA workflows TO gcz_agent;
GRANT ALL PRIVILEGES ON SCHEMA audit TO gcz_agent;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA agents TO gcz_agent;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA workflows TO gcz_agent;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO gcz_agent;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA agents TO gcz_agent;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA workflows TO gcz_agent;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO gcz_agent;