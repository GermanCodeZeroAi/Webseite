"""
Nano-Agent: Kleinste Einheit - führt genau EINEN Befehl aus
"""

from typing import Any, Dict, Callable, Optional
import asyncio
from .base_agent import BaseAgent, AgentType, AgentMetadata

class NanoAgent(BaseAgent):
    """
    Stufe 1: Nano-Agent
    
    Die kleinste funktionale Einheit. Führt exakt eine Aktion aus.
    Keine Intelligenz, keine Planung - nur reine Ausführung.
    
    Beispiele:
    - IMAP Mail abrufen
    - Wert in Datenbank schreiben
    - OCR auf PDF ausführen
    - Push-Notification senden
    """
    
    def __init__(self, 
                 name: str,
                 action: Callable,
                 description: str = "",
                 input_schema: Optional[Dict[str, Any]] = None,
                 output_schema: Optional[Dict[str, Any]] = None):
        """
        Initialisiere einen Nano-Agent
        
        Args:
            name: Name der Aktion
            action: Die auszuführende Funktion/Aktion
            description: Beschreibung was der Agent tut
            input_schema: JSON Schema für Input-Validierung
            output_schema: JSON Schema für Output-Validierung
        """
        metadata = AgentMetadata(
            name=name,
            description=description or f"Nano-Agent für {name}"
        )
        super().__init__(metadata, AgentType.NANO)
        
        self.action = action
        self.input_schema = input_schema or {}
        self.output_schema = output_schema or {}
        self.execution_count = 0
        self.last_execution_time = None
        
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Führe die einzelne Aktion aus
        """
        self.logger.debug(f"Nano-Agent {self.metadata.name} startet Ausführung")
        
        # Validierung
        if not self.validate_input(input_data):
            raise ValueError(f"Input-Validierung fehlgeschlagen für {self.metadata.name}")
            
        # Event: vor Ausführung
        self.trigger_callbacks('before_execute', input_data)
        
        try:
            # Führe die Aktion aus
            if asyncio.iscoroutinefunction(self.action):
                result = await self.action(**input_data)
            else:
                result = self.action(**input_data)
                
            # Zähle Ausführungen
            self.execution_count += 1
            
            # Formatiere Output
            output = {
                'success': True,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'result': result,
                'execution_count': self.execution_count
            }
            
            # Historie
            self.context.add_to_history(self.metadata.name, output)
            
            # Event: nach Ausführung
            self.trigger_callbacks('after_execute', output)
            
            self.logger.info(f"Nano-Agent {self.metadata.name} erfolgreich ausgeführt")
            return output
            
        except Exception as e:
            error_output = {
                'success': False,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'error': str(e),
                'error_type': type(e).__name__
            }
            
            # Event: bei Fehler
            self.trigger_callbacks('on_error', error_output)
            
            self.logger.error(f"Fehler in Nano-Agent {self.metadata.name}: {e}")
            return error_output
            
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """
        Validiere Input gegen Schema (vereinfacht)
        """
        if not self.input_schema:
            return True
            
        # Hier könnte eine JSON Schema Validierung stehen
        # Für jetzt: prüfe nur ob erforderliche Felder da sind
        required_fields = self.input_schema.get('required', [])
        for field in required_fields:
            if field not in input_data:
                self.logger.error(f"Erforderliches Feld '{field}' fehlt")
                return False
                
        return True
        
    def get_action_info(self) -> Dict[str, Any]:
        """
        Gibt Informationen über die Aktion zurück
        """
        return {
            'name': self.metadata.name,
            'description': self.metadata.description,
            'input_schema': self.input_schema,
            'output_schema': self.output_schema,
            'execution_count': self.execution_count,
            'is_async': asyncio.iscoroutinefunction(self.action)
        }


# Vordefinierte Nano-Agent Factories
class NanoAgentFactory:
    """Factory für häufig genutzte Nano-Agenten"""
    
    @staticmethod
    def create_db_write_agent(table_name: str, connection_params: Dict[str, Any]) -> NanoAgent:
        """Erstelle einen Datenbank-Schreib-Agent"""
        async def db_write_action(data: Dict[str, Any]):
            # Hier würde die echte DB-Logik stehen
            return {'inserted': True, 'table': table_name, 'data': data}
            
        return NanoAgent(
            name=f"db_write_{table_name}",
            action=db_write_action,
            description=f"Schreibt Daten in Tabelle {table_name}",
            input_schema={'required': ['data']}
        )
        
    @staticmethod
    def create_api_call_agent(endpoint: str, method: str = 'GET') -> NanoAgent:
        """Erstelle einen API-Call-Agent"""
        async def api_call_action(**kwargs):
            # Hier würde der echte API-Call stehen
            return {'status': 200, 'endpoint': endpoint, 'method': method}
            
        return NanoAgent(
            name=f"api_call_{endpoint.replace('/', '_')}",
            action=api_call_action,
            description=f"{method} Request an {endpoint}"
        )
        
    @staticmethod
    def create_file_operation_agent(operation: str) -> NanoAgent:
        """Erstelle einen Datei-Operations-Agent"""
        async def file_op_action(file_path: str, **kwargs):
            # Hier würde die echte Datei-Operation stehen
            return {'operation': operation, 'file': file_path, 'success': True}
            
        return NanoAgent(
            name=f"file_{operation}",
            action=file_op_action,
            description=f"Führt {operation} Operation auf Datei aus",
            input_schema={'required': ['file_path']}
        )