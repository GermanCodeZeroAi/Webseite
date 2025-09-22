"""
Mikro-Agent: Kombiniert mehrere Nano-Agenten zu einem kleinen Modul
"""

from typing import Any, Dict, List, Optional
import asyncio
from .base_agent import BaseAgent, AgentType, AgentMetadata
from .nano_agent import NanoAgent

class MikroAgent(BaseAgent):
    """
    Stufe 2: Mikro-Agent
    
    Kombiniert mehrere Nano-Agenten zu einem funktionalen Modul.
    Führt eine Sequenz von Aktionen aus, aber ohne komplexe Logik.
    
    Beispiele:
    - Mail-Fetcher: IMAP-Connect → Mail-Fetch → Save to DB
    - Attachment-Handler: Download → OCR → Antivirus-Scan
    - Reply-Suggester: LLM-Text → Template → Draft
    """
    
    def __init__(self,
                 name: str,
                 nano_agents: List[NanoAgent],
                 description: str = "",
                 pipeline_mode: str = "sequential"):
        """
        Initialisiere einen Mikro-Agent
        
        Args:
            name: Name des Moduls
            nano_agents: Liste von Nano-Agenten die kombiniert werden
            description: Beschreibung des Moduls
            pipeline_mode: "sequential" oder "parallel"
        """
        metadata = AgentMetadata(
            name=name,
            description=description or f"Mikro-Agent {name} mit {len(nano_agents)} Nano-Agenten"
        )
        super().__init__(metadata, AgentType.MIKRO)
        
        self.nano_agents = nano_agents
        self.pipeline_mode = pipeline_mode
        self.execution_flow = []
        
        # Registriere Nano-Agenten als Kinder
        for nano in nano_agents:
            self.context.child_agents.append(nano)
            nano.context.parent_agent = self
            
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Führe die Nano-Agent Pipeline aus
        """
        self.logger.info(f"Mikro-Agent {self.metadata.name} startet Pipeline")
        
        # Validierung
        if not self.validate_input(input_data):
            raise ValueError(f"Input-Validierung fehlgeschlagen für {self.metadata.name}")
            
        # Event: Start
        self.trigger_callbacks('pipeline_start', input_data)
        
        results = []
        current_data = input_data.copy()
        
        try:
            if self.pipeline_mode == "sequential":
                results = await self._execute_sequential(current_data)
            elif self.pipeline_mode == "parallel":
                results = await self._execute_parallel(current_data)
            else:
                raise ValueError(f"Unbekannter Pipeline-Modus: {self.pipeline_mode}")
                
            # Sammle alle Ergebnisse
            output = {
                'success': True,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'pipeline_mode': self.pipeline_mode,
                'nano_results': results,
                'final_output': results[-1]['result'] if results else None
            }
            
            # Historie
            self.context.add_to_history(f"pipeline_{self.metadata.name}", output)
            
            # Event: Ende
            self.trigger_callbacks('pipeline_complete', output)
            
            self.logger.info(f"Mikro-Agent {self.metadata.name} erfolgreich abgeschlossen")
            return output
            
        except Exception as e:
            error_output = {
                'success': False,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'error': str(e),
                'failed_at_step': len(results),
                'partial_results': results
            }
            
            # Event: Fehler
            self.trigger_callbacks('pipeline_error', error_output)
            
            self.logger.error(f"Pipeline-Fehler in {self.metadata.name}: {e}")
            return error_output
            
    async def _execute_sequential(self, input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Führe Nano-Agenten nacheinander aus
        Output von Agent N wird Input für Agent N+1
        """
        results = []
        current_data = input_data
        
        for i, nano_agent in enumerate(self.nano_agents):
            self.logger.debug(f"Führe Nano-Agent {i+1}/{len(self.nano_agents)} aus: {nano_agent.metadata.name}")
            
            # Führe Nano-Agent aus
            result = await nano_agent.execute(current_data)
            results.append(result)
            
            # Bei Fehler: Pipeline stoppen
            if not result.get('success', False):
                raise Exception(f"Nano-Agent {nano_agent.metadata.name} fehlgeschlagen: {result.get('error')}")
                
            # Verwende Output als Input für nächsten Agent
            current_data = result.get('result', {})
            
            # Event: Schritt abgeschlossen
            self.trigger_callbacks('step_complete', {
                'step': i + 1,
                'nano_agent': nano_agent.metadata.name,
                'result': result
            })
            
        return results
        
    async def _execute_parallel(self, input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Führe alle Nano-Agenten parallel aus
        Alle bekommen denselben Input
        """
        tasks = []
        
        for nano_agent in self.nano_agents:
            # Erstelle Task für jeden Nano-Agent
            task = nano_agent.execute(input_data.copy())
            tasks.append(task)
            
        # Warte auf alle Tasks
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verarbeite Ergebnisse
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    'success': False,
                    'agent_name': self.nano_agents[i].metadata.name,
                    'error': str(result)
                })
            else:
                processed_results.append(result)
                
        return processed_results
        
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """
        Validiere Input für den ersten Nano-Agent
        """
        if not self.nano_agents:
            self.logger.error("Keine Nano-Agenten definiert")
            return False
            
        # Validiere gegen ersten Nano-Agent
        return self.nano_agents[0].validate_input(input_data)
        
    def add_nano_agent(self, nano_agent: NanoAgent, position: Optional[int] = None):
        """
        Füge einen Nano-Agent zur Pipeline hinzu
        """
        if position is None:
            self.nano_agents.append(nano_agent)
        else:
            self.nano_agents.insert(position, nano_agent)
            
        # Registriere als Kind
        self.context.child_agents.append(nano_agent)
        nano_agent.context.parent_agent = self
        
    def remove_nano_agent(self, nano_agent_name: str) -> bool:
        """
        Entferne einen Nano-Agent aus der Pipeline
        """
        for i, nano in enumerate(self.nano_agents):
            if nano.metadata.name == nano_agent_name:
                removed = self.nano_agents.pop(i)
                self.context.child_agents.remove(removed)
                return True
        return False
        
    def get_pipeline_info(self) -> Dict[str, Any]:
        """
        Gibt Informationen über die Pipeline zurück
        """
        return {
            'name': self.metadata.name,
            'mode': self.pipeline_mode,
            'nano_agents': [
                {
                    'name': nano.metadata.name,
                    'description': nano.metadata.description,
                    'position': i
                }
                for i, nano in enumerate(self.nano_agents)
            ],
            'total_steps': len(self.nano_agents)
        }


# Vordefinierte Mikro-Agent Templates
class MikroAgentTemplates:
    """Vorlagen für häufig genutzte Mikro-Agenten"""
    
    @staticmethod
    def create_mail_processor() -> MikroAgent:
        """Template für Mail-Verarbeitung"""
        from .nano_agent import NanoAgentFactory
        
        nano_agents = [
            NanoAgentFactory.create_api_call_agent("/imap/connect", "POST"),
            NanoAgentFactory.create_api_call_agent("/imap/fetch", "GET"),
            NanoAgentFactory.create_db_write_agent("emails", {})
        ]
        
        return MikroAgent(
            name="mail_processor",
            nano_agents=nano_agents,
            description="Verarbeitet eingehende E-Mails",
            pipeline_mode="sequential"
        )
        
    @staticmethod
    def create_document_analyzer() -> MikroAgent:
        """Template für Dokument-Analyse"""
        # Würde echte Nano-Agenten für OCR, NLP etc. erstellen
        return MikroAgent(
            name="document_analyzer",
            nano_agents=[],  # Würde mit echten Agenten gefüllt
            description="Analysiert Dokumente mit OCR und NLP",
            pipeline_mode="sequential"
        )