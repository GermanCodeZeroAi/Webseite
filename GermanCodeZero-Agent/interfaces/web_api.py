"""
GermanCodeZero-Agent Web API Interface
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from core.agent_builder import AgentBuilder
from core.agent_registry import AgentRegistry
from core.base_agent import AgentType
from templates.template_registry import get_template_registry
from models.ollama_integration import OllamaClient, AgentLLMIntegration
from configs.windows_config import WindowsEnvironmentConfig


# Pydantic Models
class AgentSpec(BaseModel):
    type: str = Field(..., description="Agent type: nano, mikro, sub, domain, enterprise")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    template: Optional[str] = Field(None, description="Template to use")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional configuration")


class AgentExecuteRequest(BaseModel):
    agent_name: str = Field(..., description="Name of the agent to execute")
    input_data: Dict[str, Any] = Field(..., description="Input data for the agent")
    async_execution: bool = Field(False, description="Execute asynchronously")


class AgentResponse(BaseModel):
    success: bool
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    message: str
    data: Optional[Dict[str, Any]] = None


class SystemInfo(BaseModel):
    os: str
    windows_version: Optional[str]
    gpu_available: bool
    directml: bool
    vulkan: bool
    ollama_connected: bool
    agent_stats: Dict[str, int]


# Initialize FastAPI app
app = FastAPI(
    title="GermanCodeZero-Agent API",
    description="Web API für hierarchischen KI-Agent Builder",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
agent_builder = AgentBuilder()
agent_registry = AgentRegistry()
template_registry = get_template_registry()
ollama_client = OllamaClient()
llm_integration = AgentLLMIntegration(ollama_client)

# Active websocket connections
active_connections: List[WebSocket] = []

# Background task tracking
background_tasks: Dict[str, Dict[str, Any]] = {}


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Test Ollama connection
    try:
        await ollama_client.__aenter__()
        models = await ollama_client.list_models()
        print(f"Ollama connected. {len(models)} models available.")
    except Exception as e:
        print(f"Warning: Ollama not available: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await ollama_client.__aexit__(None, None, None)


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve simple web UI"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>GermanCodeZero-Agent</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; }
            .status { padding: 10px; background: #e8f4f8; border-radius: 5px; margin: 20px 0; }
            .endpoint { margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #007bff; }
            .method { font-weight: bold; color: #28a745; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 GermanCodeZero-Agent API</h1>
            <p>Willkommen zur Web-API des hierarchischen KI-Agent Builders!</p>
            
            <div class="status">
                <h3>System Status</h3>
                <p>API läuft auf: <code>http://localhost:8000</code></p>
                <p>Dokumentation: <a href="/docs">Interactive API Docs</a> | <a href="/redoc">ReDoc</a></p>
            </div>
            
            <h2>Hauptendpunkte</h2>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/v1/system/info</code>
                <p>System-Informationen abrufen</p>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <code>/api/v1/agents/create</code>
                <p>Neuen Agenten erstellen</p>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/v1/agents</code>
                <p>Alle Agenten auflisten</p>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <code>/api/v1/agents/execute</code>
                <p>Agent ausführen</p>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/v1/templates</code>
                <p>Verfügbare Templates anzeigen</p>
            </div>
            
            <div class="endpoint">
                <span class="method">WS</span> <code>/ws</code>
                <p>WebSocket für Echtzeit-Updates</p>
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/api/v1/system/info", response_model=SystemInfo)
async def get_system_info():
    """Get system information"""
    config = WindowsEnvironmentConfig()
    system_info = config.get_system_info()
    
    # Check Ollama
    ollama_connected = False
    try:
        models = await ollama_client.list_models()
        ollama_connected = len(models) > 0
    except:
        pass
    
    # Get agent stats
    agent_stats = agent_builder.get_builder_stats()
    
    return SystemInfo(
        os=system_info['os'],
        windows_version=config.windows_version,
        gpu_available=bool(system_info.get('gpu')),
        directml=config.directml_available,
        vulkan=config.vulkan_available,
        ollama_connected=ollama_connected,
        agent_stats=agent_stats['by_type']
    )


@app.post("/api/v1/agents/create", response_model=AgentResponse)
async def create_agent(spec: AgentSpec, background_tasks: BackgroundTasks):
    """Create a new agent"""
    try:
        # Convert spec to dict
        agent_spec = spec.dict()
        
        # Use template if specified
        if spec.template:
            template_id = f"{spec.type}/{spec.template}"
            template = template_registry.get_template(template_id)
            
            if not template:
                raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
                
            # Merge template with spec
            agent_spec.update(template)
            agent_spec['name'] = spec.name  # Override name
            agent_spec['description'] = spec.description  # Override description
            
        # Build agent
        agent = await agent_builder.build_agent(agent_spec)
        
        # Register agent
        success = agent_registry.register(agent)
        
        if not success:
            raise HTTPException(status_code=409, detail=f"Agent '{spec.name}' already exists")
            
        # Broadcast to websockets
        await broadcast_message({
            'event': 'agent_created',
            'agent': {
                'id': agent.metadata.id,
                'name': agent.metadata.name,
                'type': agent.agent_type.name
            }
        })
        
        return AgentResponse(
            success=True,
            agent_id=agent.metadata.id,
            agent_name=agent.metadata.name,
            message=f"Agent '{agent.metadata.name}' successfully created",
            data=agent.get_info()
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/agents")
async def list_agents(
    agent_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """List all agents with optional filtering"""
    if search:
        agent_names = agent_registry.search(search)
    elif agent_type:
        try:
            type_enum = AgentType[agent_type.upper()]
            agent_names = agent_registry.list_agents(type_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")
    else:
        agent_names = agent_registry.list_agents()
        
    # Pagination
    total = len(agent_names)
    agent_names = agent_names[offset:offset + limit]
    
    # Get agent details
    agents = []
    for name in agent_names:
        agent = agent_registry.get(name)
        if agent:
            agents.append({
                'name': agent.metadata.name,
                'type': agent.agent_type.name,
                'description': agent.metadata.description,
                'created_at': agent.metadata.created_at.isoformat(),
                'id': agent.metadata.id
            })
            
    return {
        'total': total,
        'limit': limit,
        'offset': offset,
        'agents': agents
    }


@app.get("/api/v1/agents/{agent_name}")
async def get_agent(agent_name: str):
    """Get details of a specific agent"""
    agent = agent_registry.get(agent_name)
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
        
    # Get full info including hierarchy
    info = agent.get_info()
    hierarchy = agent_registry.get_hierarchy(agent_name)
    
    # Add type-specific info
    if hasattr(agent, 'get_pipeline_info'):
        info['pipeline'] = agent.get_pipeline_info()
    elif hasattr(agent, 'get_process_info'):
        info['process'] = agent.get_process_info()
    elif hasattr(agent, 'get_domain_info'):
        info['domain'] = agent.get_domain_info()
    elif hasattr(agent, 'get_enterprise_info'):
        info['enterprise'] = agent.get_enterprise_info()
        
    return {
        'agent': info,
        'hierarchy': hierarchy
    }


@app.post("/api/v1/agents/execute", response_model=AgentResponse)
async def execute_agent(request: AgentExecuteRequest, background_tasks: BackgroundTasks):
    """Execute an agent"""
    agent = agent_registry.get(request.agent_name)
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{request.agent_name}' not found")
        
    if request.async_execution:
        # Execute in background
        task_id = str(uuid.uuid4())
        background_tasks.add_task(execute_agent_background, task_id, agent, request.input_data)
        
        return AgentResponse(
            success=True,
            agent_id=agent.metadata.id,
            agent_name=agent.metadata.name,
            message=f"Agent execution started in background",
            data={'task_id': task_id}
        )
    else:
        # Execute synchronously
        try:
            agent.start()
            result = await agent.execute(request.input_data)
            agent.stop()
            
            return AgentResponse(
                success=result.get('success', False),
                agent_id=agent.metadata.id,
                agent_name=agent.metadata.name,
                message="Execution completed",
                data=result
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")


@app.get("/api/v1/agents/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a background task"""
    if task_id not in background_tasks:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
        
    return background_tasks[task_id]


@app.delete("/api/v1/agents/{agent_name}")
async def delete_agent(agent_name: str):
    """Delete an agent"""
    success = agent_registry.unregister(agent_name)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
        
    # Broadcast deletion
    await broadcast_message({
        'event': 'agent_deleted',
        'agent_name': agent_name
    })
    
    return {'success': True, 'message': f"Agent '{agent_name}' deleted"}


@app.get("/api/v1/templates")
async def list_templates(
    level: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """List available templates"""
    if search:
        templates = template_registry.search_templates(search)
    elif level:
        templates = template_registry.get_templates_by_level(level)
    elif category:
        templates = template_registry.get_templates_by_category(category)
    else:
        templates = list(template_registry.templates.values())
        
    # Format response
    return {
        'total': len(templates),
        'templates': [
            {
                'id': t['_metadata']['id'],
                'name': t['name'],
                'type': t.get('type'),
                'description': t.get('description'),
                'level': t['_metadata']['level'],
                'category': t['_metadata']['category']
            }
            for t in templates
        ]
    }


@app.get("/api/v1/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template"""
    # Replace / with the actual separator
    template_id = template_id.replace('-', '/')
    template = template_registry.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        
    return template


@app.post("/api/v1/llm/generate")
async def generate_with_llm(
    prompt: str,
    task_type: str = "reasoning",
    model: Optional[str] = None,
    max_tokens: int = 2048
):
    """Generate text using LLM"""
    try:
        response = await ollama_client.generate(
            prompt=prompt,
            model=model,
            task_type=task_type,
            max_tokens=max_tokens
        )
        
        return {
            'success': True,
            'response': response,
            'model_used': model or 'auto-selected'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")


@app.post("/api/v1/llm/generate-agent-code")
async def generate_agent_code(
    task_description: str,
    input_schema: Dict[str, Any],
    output_schema: Dict[str, Any]
):
    """Generate code for a nano agent using LLM"""
    try:
        code = await llm_integration.generate_nano_action(
            task_description=task_description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        return {
            'success': True,
            'code': code,
            'language': 'python'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            'event': 'connected',
            'message': 'Connected to GermanCodeZero-Agent WebSocket'
        })
        
        # Keep connection alive
        while True:
            # Receive messages
            data = await websocket.receive_text()
            
            # Echo back (or process commands)
            await websocket.send_json({
                'event': 'echo',
                'data': data
            })
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)


@app.get("/api/v1/export")
async def export_agents(format: str = "yaml"):
    """Export all agents"""
    if format not in ["yaml", "json"]:
        raise HTTPException(status_code=400, detail="Format must be 'yaml' or 'json'")
        
    # Create export data
    export_data = {
        'exported_at': datetime.now().isoformat(),
        'statistics': agent_registry.get_statistics(),
        'agents': []
    }
    
    for name in agent_registry.list_agents():
        agent = agent_registry.get(name)
        if agent:
            export_data['agents'].append({
                'name': agent.metadata.name,
                'type': agent.agent_type.name,
                'description': agent.metadata.description,
                'created_at': agent.metadata.created_at.isoformat()
            })
            
    # Format response
    if format == "yaml":
        import yaml
        content = yaml.dump(export_data, default_flow_style=False, allow_unicode=True)
        media_type = "application/x-yaml"
    else:
        content = json.dumps(export_data, indent=2, ensure_ascii=False)
        media_type = "application/json"
        
    return StreamingResponse(
        iter([content.encode()]),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename=agents_export.{format}"
        }
    )


# Helper functions
async def execute_agent_background(task_id: str, agent, input_data: Dict[str, Any]):
    """Execute agent in background"""
    background_tasks[task_id] = {
        'status': 'running',
        'started_at': datetime.now().isoformat(),
        'agent_name': agent.metadata.name
    }
    
    try:
        agent.start()
        result = await agent.execute(input_data)
        agent.stop()
        
        background_tasks[task_id].update({
            'status': 'completed',
            'completed_at': datetime.now().isoformat(),
            'result': result
        })
        
        # Broadcast completion
        await broadcast_message({
            'event': 'task_completed',
            'task_id': task_id,
            'agent_name': agent.metadata.name,
            'success': result.get('success', False)
        })
        
    except Exception as e:
        background_tasks[task_id].update({
            'status': 'failed',
            'completed_at': datetime.now().isoformat(),
            'error': str(e)
        })
        
        # Broadcast failure
        await broadcast_message({
            'event': 'task_failed',
            'task_id': task_id,
            'agent_name': agent.metadata.name,
            'error': str(e)
        })


async def broadcast_message(message: Dict[str, Any]):
    """Broadcast message to all websocket connections"""
    disconnected = []
    
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            disconnected.append(connection)
            
    # Remove disconnected
    for conn in disconnected:
        active_connections.remove(conn)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)