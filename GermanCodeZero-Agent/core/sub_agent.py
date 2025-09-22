"""
Sub-Agent: Teilprozess mit Entscheidungslogik
"""

from typing import Any, Dict, List, Optional, Union
import asyncio
from .base_agent import BaseAgent, AgentType, AgentMetadata
from .mikro_agent import MikroAgent
from .nano_agent import NanoAgent

class ConditionalFlow:
    """Definiert bedingte Abläufe für Sub-Agenten"""
    
    def __init__(self, condition: callable, true_path: Union[MikroAgent, NanoAgent], 
                 false_path: Optional[Union[MikroAgent, NanoAgent]] = None):
        self.condition = condition
        self.true_path = true_path
        self.false_path = false_path
        
    async def evaluate(self, context: Dict[str, Any]) -> Union[MikroAgent, NanoAgent, None]:
        """Evaluiere Bedingung und gib den entsprechenden Pfad zurück"""
        if await self.condition(context) if asyncio.iscoroutinefunction(self.condition) else self.condition(context):
            return self.true_path
        return self.false_path

class SubAgent(BaseAgent):
    """
    Stufe 3: Sub-Agent
    
    Verwaltet Teilprozesse mit Entscheidungslogik.
    Kann verschiedene Mikro-Agenten basierend auf Bedingungen aufrufen.
    
    Beispiele:
    - Termin-Agent: Erkennt Termin-Mail → Parser → Kalender-Check → Event erstellen
    - Compliance-Agent: Scannt Mail → Bewertet Risiko → Entscheidet über Freigabe
    - Bestell-Agent: Extrahiert Daten → Validiert → Legt Bestellung an → Bestätigung
    """
    
    def __init__(self,
                 name: str,
                 description: str = "",
                 decision_logic: Optional[Dict[str, Any]] = None):
        """
        Initialisiere einen Sub-Agent
        
        Args:
            name: Name des Teilprozesses
            description: Beschreibung
            decision_logic: Entscheidungslogik-Konfiguration
        """
        metadata = AgentMetadata(
            name=name,
            description=description or f"Sub-Agent für {name} Prozess"
        )
        super().__init__(metadata, AgentType.SUB)
        
        self.mikro_agents: Dict[str, MikroAgent] = {}
        self.nano_agents: Dict[str, NanoAgent] = {}
        self.workflows: Dict[str, List[str]] = {}
        self.conditional_flows: List[ConditionalFlow] = []
        self.decision_logic = decision_logic or {}
        self.error_handlers: Dict[str, callable] = {}
        self.retry_config = {
            'max_retries': 3,
            'retry_delay': 1.0,
            'exponential_backoff': True
        }
        
    def add_mikro_agent(self, mikro_agent: MikroAgent):
        """Füge einen Mikro-Agent hinzu"""
        self.mikro_agents[mikro_agent.metadata.name] = mikro_agent
        self.context.child_agents.append(mikro_agent)
        mikro_agent.context.parent_agent = self
        
    def add_nano_agent(self, nano_agent: NanoAgent):
        """Füge einen einzelnen Nano-Agent hinzu (für einfache Entscheidungen)"""
        self.nano_agents[nano_agent.metadata.name] = nano_agent
        self.context.child_agents.append(nano_agent)
        nano_agent.context.parent_agent = self
        
    def define_workflow(self, name: str, steps: List[str]):
        """
        Definiere einen Workflow als Sequenz von Agent-Namen
        
        Args:
            name: Workflow-Name
            steps: Liste von Agent-Namen in Ausführungsreihenfolge
        """
        self.workflows[name] = steps
        
    def add_conditional_flow(self, condition: callable, 
                           true_agent: Union[MikroAgent, NanoAgent],
                           false_agent: Optional[Union[MikroAgent, NanoAgent]] = None):
        """Füge eine bedingte Verzweigung hinzu"""
        flow = ConditionalFlow(condition, true_agent, false_agent)
        self.conditional_flows.append(flow)
        
    def set_error_handler(self, error_type: str, handler: callable):
        """Setze einen Error-Handler für bestimmte Fehlertypen"""
        self.error_handlers[error_type] = handler
        
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Führe den Teilprozess mit Entscheidungslogik aus
        """
        self.logger.info(f"Sub-Agent {self.metadata.name} startet Prozess")
        
        # Validierung
        if not self.validate_input(input_data):
            raise ValueError(f"Input-Validierung fehlgeschlagen für {self.metadata.name}")
            
        # Event: Start
        self.trigger_callbacks('process_start', input_data)
        
        # Kontext initialisieren
        process_context = {
            'input': input_data,
            'current_step': 0,
            'results': [],
            'decisions': [],
            'errors': []
        }
        
        try:
            # Hauptprozess-Logik
            result = await self._execute_process_logic(process_context)
            
            # Erfolgreiches Ergebnis
            output = {
                'success': True,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'process_context': process_context,
                'final_result': result,
                'decisions_made': process_context['decisions'],
                'steps_executed': process_context['current_step']
            }
            
            # Historie
            self.context.add_to_history(f"process_{self.metadata.name}", output)
            
            # Event: Ende
            self.trigger_callbacks('process_complete', output)
            
            self.logger.info(f"Sub-Agent {self.metadata.name} erfolgreich abgeschlossen")
            return output
            
        except Exception as e:
            # Fehlerbehandlung
            error_handled = await self._handle_error(e, process_context)
            
            if error_handled:
                return error_handled
            else:
                error_output = {
                    'success': False,
                    'agent_id': self.metadata.id,
                    'agent_name': self.metadata.name,
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'process_context': process_context
                }
                
                # Event: Fehler
                self.trigger_callbacks('process_error', error_output)
                
                self.logger.error(f"Prozess-Fehler in {self.metadata.name}: {e}")
                return error_output
                
    async def _execute_process_logic(self, context: Dict[str, Any]) -> Any:
        """
        Hauptlogik des Teilprozesses
        """
        # 1. Prüfe auf vordefinierte Workflows
        workflow_name = context['input'].get('workflow', 'default')
        if workflow_name in self.workflows:
            return await self._execute_workflow(workflow_name, context)
            
        # 2. Prüfe bedingte Flows
        for flow in self.conditional_flows:
            agent = await flow.evaluate(context)
            if agent:
                context['decisions'].append({
                    'type': 'conditional',
                    'condition': str(flow.condition),
                    'selected': agent.metadata.name
                })
                
                result = await self._execute_agent(agent, context)
                if result.get('success'):
                    return result
                    
        # 3. Fallback: Führe alle Mikro-Agenten der Reihe nach aus
        for name, mikro_agent in self.mikro_agents.items():
            result = await self._execute_agent(mikro_agent, context)
            if not result.get('success'):
                # Entscheide ob weitermachen oder abbrechen
                if self.decision_logic.get('stop_on_error', True):
                    raise Exception(f"Mikro-Agent {name} fehlgeschlagen")
                    
        return context['results']
        
    async def _execute_workflow(self, workflow_name: str, context: Dict[str, Any]) -> Any:
        """Führe einen vordefinierten Workflow aus"""
        steps = self.workflows[workflow_name]
        results = []
        
        for step_name in steps:
            # Finde den Agent
            agent = self._find_agent(step_name)
            if not agent:
                raise ValueError(f"Agent '{step_name}' nicht gefunden im Workflow '{workflow_name}'")
                
            # Führe aus
            result = await self._execute_agent(agent, context)
            results.append(result)
            
            # Bei Fehler und stop_on_error
            if not result.get('success') and self.decision_logic.get('stop_on_error', True):
                raise Exception(f"Workflow-Schritt '{step_name}' fehlgeschlagen")
                
        return results
        
    async def _execute_agent(self, agent: Union[MikroAgent, NanoAgent], 
                           context: Dict[str, Any]) -> Dict[str, Any]:
        """Führe einen Agent mit Retry-Logik aus"""
        retries = 0
        last_error = None
        
        while retries <= self.retry_config['max_retries']:
            try:
                # Bereite Input vor
                agent_input = self._prepare_agent_input(agent, context)
                
                # Führe aus
                result = await agent.execute(agent_input)
                
                # Speichere Ergebnis
                context['results'].append(result)
                context['current_step'] += 1
                
                return result
                
            except Exception as e:
                last_error = e
                retries += 1
                
                if retries <= self.retry_config['max_retries']:
                    # Warte vor Retry
                    delay = self.retry_config['retry_delay']
                    if self.retry_config['exponential_backoff']:
                        delay *= (2 ** (retries - 1))
                        
                    self.logger.warning(f"Retry {retries}/{self.retry_config['max_retries']} "
                                      f"für {agent.metadata.name} nach {delay}s")
                    await asyncio.sleep(delay)
                    
        # Alle Retries fehlgeschlagen
        raise last_error
        
    def _find_agent(self, name: str) -> Optional[Union[MikroAgent, NanoAgent]]:
        """Finde einen Agent nach Name"""
        if name in self.mikro_agents:
            return self.mikro_agents[name]
        elif name in self.nano_agents:
            return self.nano_agents[name]
        return None
        
    def _prepare_agent_input(self, agent: Union[MikroAgent, NanoAgent], 
                           context: Dict[str, Any]) -> Dict[str, Any]:
        """Bereite Input für einen Agent vor basierend auf Kontext"""
        # Basis-Input
        agent_input = context['input'].copy()
        
        # Füge vorherige Ergebnisse hinzu wenn verfügbar
        if context['results']:
            last_result = context['results'][-1]
            if isinstance(last_result, dict) and 'result' in last_result:
                agent_input.update(last_result['result'])
                
        return agent_input
        
    async def _handle_error(self, error: Exception, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Behandle Fehler mit registrierten Handlers"""
        error_type = type(error).__name__
        
        if error_type in self.error_handlers:
            handler = self.error_handlers[error_type]
            try:
                recovery_result = await handler(error, context) if asyncio.iscoroutinefunction(handler) else handler(error, context)
                
                if recovery_result:
                    return {
                        'success': True,
                        'agent_id': self.metadata.id,
                        'agent_name': self.metadata.name,
                        'recovered': True,
                        'recovery_result': recovery_result,
                        'original_error': str(error)
                    }
            except Exception as handler_error:
                self.logger.error(f"Error-Handler fehlgeschlagen: {handler_error}")
                
        return None
        
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validiere Input für den Prozess"""
        # Basis-Validierung
        if not isinstance(input_data, dict):
            return False
            
        # Prüfe ob erforderliche Felder vorhanden sind
        required_fields = self.decision_logic.get('required_fields', [])
        for field in required_fields:
            if field not in input_data:
                self.logger.error(f"Erforderliches Feld '{field}' fehlt")
                return False
                
        return True
        
    def get_process_info(self) -> Dict[str, Any]:
        """Gibt Informationen über den Prozess zurück"""
        return {
            'name': self.metadata.name,
            'description': self.metadata.description,
            'mikro_agents': list(self.mikro_agents.keys()),
            'nano_agents': list(self.nano_agents.keys()),
            'workflows': list(self.workflows.keys()),
            'conditional_flows': len(self.conditional_flows),
            'error_handlers': list(self.error_handlers.keys()),
            'retry_config': self.retry_config
        }