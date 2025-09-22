"""
Ollama Integration für lokale LLM-Modelle
"""

import aiohttp
import asyncio
from typing import Dict, Any, List, Optional, AsyncGenerator
import json
from datetime import datetime
import logging


class OllamaClient:
    """
    Client für die Kommunikation mit Ollama API
    Unterstützt lokale LLM-Modelle auf Windows 11
    """
    
    def __init__(self, 
                 base_url: str = "http://localhost:11434",
                 timeout: int = 120):
        """
        Initialisiere Ollama Client
        
        Args:
            base_url: Basis-URL der Ollama API
            timeout: Timeout für Requests in Sekunden
        """
        self.base_url = base_url
        self.timeout = timeout
        self.logger = logging.getLogger("OllamaClient")
        self._session: Optional[aiohttp.ClientSession] = None
        
        # Model-Konfigurationen für verschiedene Aufgaben
        self.model_configs = {
            'code_generation': {
                'model': 'deepseek-coder:latest',
                'temperature': 0.7,
                'top_p': 0.95
            },
            'reasoning': {
                'model': 'llama3:70b',
                'temperature': 0.8,
                'top_p': 0.9
            },
            'classification': {
                'model': 'mistral:latest',
                'temperature': 0.3,
                'top_p': 0.85
            },
            'embedding': {
                'model': 'nomic-embed-text:latest'
            }
        }
        
    async def __aenter__(self):
        """Async Context Manager Entry"""
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async Context Manager Exit"""
        if self._session:
            await self._session.close()
            
    @property
    def session(self) -> aiohttp.ClientSession:
        """Get or create session"""
        if not self._session:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
        return self._session
        
    async def list_models(self) -> List[Dict[str, Any]]:
        """
        Liste alle verfügbaren Modelle
        
        Returns:
            Liste der installierten Modelle
        """
        try:
            async with self.session.get(f"{self.base_url}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('models', [])
                else:
                    self.logger.error(f"Fehler beim Abrufen der Modelle: {response.status}")
                    return []
        except Exception as e:
            self.logger.error(f"Verbindungsfehler zu Ollama: {e}")
            return []
            
    async def pull_model(self, model_name: str) -> bool:
        """
        Lade ein Modell herunter
        
        Args:
            model_name: Name des Modells
            
        Returns:
            True wenn erfolgreich
        """
        try:
            async with self.session.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name}
            ) as response:
                if response.status == 200:
                    # Stream die Progress-Updates
                    async for line in response.content:
                        if line:
                            data = json.loads(line)
                            if 'status' in data:
                                self.logger.info(f"Pull {model_name}: {data['status']}")
                    return True
                else:
                    self.logger.error(f"Fehler beim Pull: {response.status}")
                    return False
        except Exception as e:
            self.logger.error(f"Fehler beim Model-Pull: {e}")
            return False
            
    async def generate(self,
                      prompt: str,
                      model: Optional[str] = None,
                      task_type: str = 'reasoning',
                      system_prompt: Optional[str] = None,
                      temperature: Optional[float] = None,
                      max_tokens: int = 2048,
                      stream: bool = False) -> Union[str, AsyncGenerator[str, None]]:
        """
        Generiere Text mit einem LLM
        
        Args:
            prompt: Der Eingabe-Prompt
            model: Modell-Name (optional, sonst Task-basiert)
            task_type: Typ der Aufgabe für Model-Auswahl
            system_prompt: System-Prompt für Kontext
            temperature: Temperatur für Sampling
            max_tokens: Maximale Token-Anzahl
            stream: Ob Response gestreamt werden soll
            
        Returns:
            Generierter Text oder Stream
        """
        # Wähle Model basierend auf Task
        if not model:
            model_config = self.model_configs.get(task_type, self.model_configs['reasoning'])
            model = model_config['model']
            temperature = temperature or model_config.get('temperature', 0.7)
        else:
            temperature = temperature or 0.7
            
        # Baue Request
        request_data = {
            'model': model,
            'prompt': prompt,
            'temperature': temperature,
            'options': {
                'num_predict': max_tokens
            },
            'stream': stream
        }
        
        if system_prompt:
            request_data['system'] = system_prompt
            
        try:
            async with self.session.post(
                f"{self.base_url}/api/generate",
                json=request_data
            ) as response:
                if response.status == 200:
                    if stream:
                        return self._stream_response(response)
                    else:
                        full_response = ""
                        async for line in response.content:
                            if line:
                                data = json.loads(line)
                                if 'response' in data:
                                    full_response += data['response']
                        return full_response
                else:
                    error_text = await response.text()
                    self.logger.error(f"Generation Error: {error_text}")
                    return ""
        except Exception as e:
            self.logger.error(f"Generation Exception: {e}")
            return ""
            
    async def _stream_response(self, response) -> AsyncGenerator[str, None]:
        """Stream die Response Token für Token"""
        async for line in response.content:
            if line:
                data = json.loads(line)
                if 'response' in data:
                    yield data['response']
                    
    async def chat(self,
                  messages: List[Dict[str, str]],
                  model: Optional[str] = None,
                  task_type: str = 'reasoning',
                  temperature: Optional[float] = None,
                  max_tokens: int = 2048) -> str:
        """
        Chat-Completion mit Konversations-Historie
        
        Args:
            messages: Liste von Chat-Nachrichten
            model: Modell-Name
            task_type: Task-Typ für Model-Auswahl
            temperature: Sampling-Temperatur
            max_tokens: Max Token-Anzahl
            
        Returns:
            Antwort des Modells
        """
        # Wähle Model
        if not model:
            model_config = self.model_configs.get(task_type, self.model_configs['reasoning'])
            model = model_config['model']
            temperature = temperature or model_config.get('temperature', 0.7)
        else:
            temperature = temperature or 0.7
            
        request_data = {
            'model': model,
            'messages': messages,
            'temperature': temperature,
            'options': {
                'num_predict': max_tokens
            },
            'stream': False
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/api/chat",
                json=request_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('message', {}).get('content', '')
                else:
                    self.logger.error(f"Chat Error: {response.status}")
                    return ""
        except Exception as e:
            self.logger.error(f"Chat Exception: {e}")
            return ""
            
    async def embeddings(self,
                        text: str,
                        model: Optional[str] = None) -> List[float]:
        """
        Generiere Text-Embeddings
        
        Args:
            text: Eingabetext
            model: Embedding-Modell
            
        Returns:
            Embedding-Vektor
        """
        model = model or self.model_configs['embedding']['model']
        
        request_data = {
            'model': model,
            'prompt': text
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/api/embeddings",
                json=request_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('embedding', [])
                else:
                    self.logger.error(f"Embedding Error: {response.status}")
                    return []
        except Exception as e:
            self.logger.error(f"Embedding Exception: {e}")
            return []


class AgentLLMIntegration:
    """
    Integration von LLM-Fähigkeiten in Agenten
    """
    
    def __init__(self, ollama_client: OllamaClient):
        """
        Initialisiere LLM-Integration
        
        Args:
            ollama_client: Ollama Client Instanz
        """
        self.ollama = ollama_client
        self.logger = logging.getLogger("AgentLLMIntegration")
        
        # Prompt-Templates für verschiedene Agent-Typen
        self.prompt_templates = {
            'nano_code_generation': """
Du bist ein Code-Generator für Nano-Agenten.
Generiere eine Python-Funktion für folgende Aufgabe:

Aufgabe: {task_description}
Input-Schema: {input_schema}
Output-Schema: {output_schema}

Generiere NUR die Funktion ohne weitere Erklärungen.
Die Funktion sollte async sein und die angegebenen Schemas respektieren.
""",
            'mikro_orchestration': """
Du bist ein Orchestrierungs-Experte für Mikro-Agenten.
Analysiere folgende Nano-Agenten und erstelle einen optimalen Workflow:

Verfügbare Nano-Agenten:
{nano_agents}

Ziel: {goal}

Erstelle eine Pipeline-Definition mit der optimalen Reihenfolge und Modus (sequential/parallel).
""",
            'sub_decision_logic': """
Du bist ein Entscheidungslogik-Designer für Sub-Agenten.
Erstelle Entscheidungsregeln für folgenden Prozess:

Prozessbeschreibung: {process_description}
Verfügbare Mikro-Agenten: {mikro_agents}
Geschäftsregeln: {business_rules}

Definiere Bedingungen und Routing-Logik im JSON-Format.
""",
            'domain_classification': """
Du bist ein Domain-Klassifizierer.
Klassifiziere folgende Anfrage und bestimme die relevanten Sub-Agenten:

Anfrage: {request}
Verfügbare Sub-Agenten: {sub_agents}
Domain-Policies: {policies}

Gib die Klassifikation und routing-Entscheidungen zurück.
""",
            'enterprise_process': """
Du bist ein Business-Prozess-Analyst.
Analysiere folgende Unternehmensanforderung und erstelle einen Geschäftsprozess:

Anforderung: {requirement}
Branche: {industry}
Verfügbare Domains: {domains}
Compliance: {compliance}

Erstelle einen strukturierten Geschäftsprozess mit allen notwendigen Schritten.
"""
        }
        
    async def generate_nano_action(self, task_description: str,
                                 input_schema: Dict[str, Any],
                                 output_schema: Dict[str, Any]) -> str:
        """
        Generiere Code für eine Nano-Agent Aktion
        
        Args:
            task_description: Beschreibung der Aufgabe
            input_schema: Input-Schema
            output_schema: Output-Schema
            
        Returns:
            Generierter Python-Code
        """
        prompt = self.prompt_templates['nano_code_generation'].format(
            task_description=task_description,
            input_schema=json.dumps(input_schema, indent=2),
            output_schema=json.dumps(output_schema, indent=2)
        )
        
        code = await self.ollama.generate(
            prompt=prompt,
            task_type='code_generation',
            temperature=0.7
        )
        
        return code
        
    async def design_mikro_workflow(self, nano_agents: List[Dict[str, Any]],
                                  goal: str) -> Dict[str, Any]:
        """
        Designe einen Mikro-Agent Workflow
        
        Args:
            nano_agents: Liste verfügbarer Nano-Agenten
            goal: Ziel des Workflows
            
        Returns:
            Workflow-Definition
        """
        agents_desc = "\n".join([
            f"- {agent['name']}: {agent['description']}"
            for agent in nano_agents
        ])
        
        prompt = self.prompt_templates['mikro_orchestration'].format(
            nano_agents=agents_desc,
            goal=goal
        )
        
        response = await self.ollama.generate(
            prompt=prompt,
            task_type='reasoning',
            temperature=0.6
        )
        
        # Parse Response zu strukturiertem Format
        # In Produktion würde hier ein robuster Parser stehen
        return {
            'pipeline_mode': 'sequential',
            'workflow': response
        }
        
    async def create_decision_logic(self, process_description: str,
                                  mikro_agents: List[str],
                                  business_rules: List[str]) -> Dict[str, Any]:
        """
        Erstelle Entscheidungslogik für Sub-Agenten
        
        Args:
            process_description: Prozessbeschreibung
            mikro_agents: Verfügbare Mikro-Agenten
            business_rules: Geschäftsregeln
            
        Returns:
            Entscheidungslogik-Definition
        """
        prompt = self.prompt_templates['sub_decision_logic'].format(
            process_description=process_description,
            mikro_agents=", ".join(mikro_agents),
            business_rules="\n".join(f"- {rule}" for rule in business_rules)
        )
        
        response = await self.ollama.generate(
            prompt=prompt,
            task_type='reasoning',
            temperature=0.5
        )
        
        # Vereinfachte Logik-Extraktion
        return {
            'decision_rules': response,
            'routing_logic': 'dynamic'
        }
        
    async def classify_domain_request(self, request: str,
                                    sub_agents: List[str],
                                    policies: Dict[str, Any]) -> Dict[str, Any]:
        """
        Klassifiziere eine Domain-Anfrage
        
        Args:
            request: Die Anfrage
            sub_agents: Verfügbare Sub-Agenten
            policies: Domain-Policies
            
        Returns:
            Klassifikation und Routing
        """
        prompt = self.prompt_templates['domain_classification'].format(
            request=request,
            sub_agents=", ".join(sub_agents),
            policies=json.dumps(policies, indent=2)
        )
        
        response = await self.ollama.generate(
            prompt=prompt,
            task_type='classification',
            temperature=0.3
        )
        
        return {
            'classification': response,
            'confidence': 0.85  # In Produktion würde hier echte Confidence berechnet
        }
        
    async def design_business_process(self, requirement: str,
                                    industry: str,
                                    domains: List[str],
                                    compliance: List[str]) -> Dict[str, Any]:
        """
        Designe einen Enterprise Business-Prozess
        
        Args:
            requirement: Geschäftsanforderung
            industry: Branche
            domains: Verfügbare Domains
            compliance: Compliance-Anforderungen
            
        Returns:
            Business-Prozess Definition
        """
        prompt = self.prompt_templates['enterprise_process'].format(
            requirement=requirement,
            industry=industry,
            domains=", ".join(domains),
            compliance=", ".join(compliance)
        )
        
        response = await self.ollama.generate(
            prompt=prompt,
            task_type='reasoning',
            temperature=0.6,
            max_tokens=4096
        )
        
        return {
            'process_definition': response,
            'industry': industry,
            'compliance_integrated': True
        }
        
    async def analyze_agent_performance(self, agent_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analysiere Agent-Performance und gib Verbesserungsvorschläge
        
        Args:
            agent_metrics: Performance-Metriken
            
        Returns:
            Analyse und Empfehlungen
        """
        prompt = f"""
Analysiere folgende Agent-Performance-Metriken und gib Verbesserungsvorschläge:

Metriken:
{json.dumps(agent_metrics, indent=2)}

Identifiziere Bottlenecks, ineffiziente Patterns und Optimierungsmöglichkeiten.
"""
        
        analysis = await self.ollama.generate(
            prompt=prompt,
            task_type='reasoning',
            temperature=0.7
        )
        
        return {
            'analysis': analysis,
            'timestamp': datetime.now().isoformat()
        }


# Utility-Funktionen für Windows 11 spezifische Konfiguration
def get_windows_optimal_models() -> Dict[str, str]:
    """
    Gibt optimale Modelle für Windows 11 mit DirectML/Vulkan zurück
    """
    return {
        'heavy_reasoning': 'llama3:70b-instruct-q4_K_M',  # Für GPU mit DirectML
        'code_generation': 'deepseek-coder:33b-instruct-q4_K_M',
        'light_tasks': 'mistral:7b-instruct-q4_K_M',  # Für Docker
        'embeddings': 'nomic-embed-text:latest'
    }


async def setup_ollama_for_windows(ollama_client: OllamaClient) -> bool:
    """
    Setup Ollama für Windows 11 mit optimalen Einstellungen
    
    Args:
        ollama_client: Ollama Client Instanz
        
    Returns:
        True wenn erfolgreich
    """
    models = get_windows_optimal_models()
    
    # Prüfe verfügbare Modelle
    available = await ollama_client.list_models()
    available_names = [m['name'] for m in available]
    
    # Lade fehlende Modelle
    for task, model in models.items():
        if model not in available_names:
            print(f"Lade Modell für {task}: {model}")
            success = await ollama_client.pull_model(model)
            if not success:
                print(f"Fehler beim Laden von {model}")
                return False
                
    return True