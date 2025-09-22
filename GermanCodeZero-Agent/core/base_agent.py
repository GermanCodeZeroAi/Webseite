"""
Basis-Klasse für alle Agent-Typen
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Callable
from datetime import datetime
import uuid
import logging
from dataclasses import dataclass, field

class AgentType(Enum):
    """Die 5 Hierarchiestufen der Agenten"""
    NANO = 1        # Einzelbefehl
    MIKRO = 2       # Modulkombination
    SUB = 3         # Teilprozess mit Logik
    DOMAIN = 4      # Fachbereich
    ENTERPRISE = 5  # Komplettlösung

@dataclass
class AgentMetadata:
    """Metadaten für jeden Agenten"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    version: str = "1.0.0"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)
    author: str = "GermanCodeZero"
    
class AgentContext:
    """Kontext für Agent-Ausführung"""
    def __init__(self):
        self.variables: Dict[str, Any] = {}
        self.history: List[Dict[str, Any]] = []
        self.parent_agent: Optional['BaseAgent'] = None
        self.child_agents: List['BaseAgent'] = []
        
    def set_variable(self, key: str, value: Any):
        """Setze eine Kontextvariable"""
        self.variables[key] = value
        
    def get_variable(self, key: str, default: Any = None) -> Any:
        """Hole eine Kontextvariable"""
        return self.variables.get(key, default)
        
    def add_to_history(self, action: str, result: Any):
        """Füge zur Ausführungshistorie hinzu"""
        self.history.append({
            'timestamp': datetime.now(),
            'action': action,
            'result': result
        })

class BaseAgent(ABC):
    """
    Abstrakte Basisklasse für alle Agent-Typen
    """
    
    def __init__(self, metadata: AgentMetadata, agent_type: AgentType):
        self.metadata = metadata
        self.agent_type = agent_type
        self.context = AgentContext()
        self.logger = logging.getLogger(f"{self.__class__.__name__}.{metadata.name}")
        self._callbacks: Dict[str, List[Callable]] = {}
        self._is_running = False
        
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Hauptausführungsmethode - muss von jeder Agent-Klasse implementiert werden
        """
        pass
        
    @abstractmethod
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """
        Validiere Eingabedaten
        """
        pass
        
    def register_callback(self, event: str, callback: Callable):
        """
        Registriere einen Callback für ein Event
        """
        if event not in self._callbacks:
            self._callbacks[event] = []
        self._callbacks[event].append(callback)
        
    def trigger_callbacks(self, event: str, data: Any = None):
        """
        Löse alle Callbacks für ein Event aus
        """
        if event in self._callbacks:
            for callback in self._callbacks[event]:
                try:
                    callback(self, data)
                except Exception as e:
                    self.logger.error(f"Callback error for event {event}: {e}")
                    
    def get_info(self) -> Dict[str, Any]:
        """
        Gibt Informationen über den Agenten zurück
        """
        return {
            'id': self.metadata.id,
            'name': self.metadata.name,
            'type': self.agent_type.name,
            'description': self.metadata.description,
            'version': self.metadata.version,
            'created_at': self.metadata.created_at.isoformat(),
            'is_running': self._is_running
        }
        
    def start(self):
        """Starte den Agenten"""
        self._is_running = True
        self.trigger_callbacks('start')
        self.logger.info(f"Agent {self.metadata.name} gestartet")
        
    def stop(self):
        """Stoppe den Agenten"""
        self._is_running = False
        self.trigger_callbacks('stop')
        self.logger.info(f"Agent {self.metadata.name} gestoppt")
        
    def __repr__(self):
        return f"<{self.__class__.__name__}(name='{self.metadata.name}', type={self.agent_type.name})>"