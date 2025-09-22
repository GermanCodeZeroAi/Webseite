"""
Agent-Registry: Zentrale Verwaltung aller Agenten
"""

from typing import Dict, List, Optional, Any, Set
from datetime import datetime
import json
import sqlite3
from pathlib import Path
import pickle

from .base_agent import BaseAgent, AgentType


class AgentRegistry:
    """
    Zentrale Registry für alle erstellten Agenten.
    Bietet Persistenz, Suche und Verwaltungsfunktionen.
    """
    
    def __init__(self, storage_path: str = "/workspace/GermanCodeZero-Agent/data/registry.db"):
        """
        Initialisiere die Registry
        
        Args:
            storage_path: Pfad zur SQLite Datenbank
        """
        self.storage_path = storage_path
        self.agents: Dict[str, BaseAgent] = {}
        self.metadata_cache: Dict[str, Dict[str, Any]] = {}
        
        # Stelle sicher dass Verzeichnis existiert
        Path(storage_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Initialisiere Datenbank
        self._init_database()
        
        # Lade existierende Agenten
        self._load_agents()
        
    def _init_database(self):
        """Initialisiere die Datenbank-Struktur"""
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        
        # Agenten-Tabelle
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                version TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                author TEXT,
                tags TEXT,
                serialized_agent BLOB,
                metadata TEXT
            )
        """)
        
        # Beziehungen-Tabelle
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_relationships (
                parent_id TEXT,
                child_id TEXT,
                relationship_type TEXT,
                created_at TIMESTAMP,
                PRIMARY KEY (parent_id, child_id),
                FOREIGN KEY (parent_id) REFERENCES agents(id),
                FOREIGN KEY (child_id) REFERENCES agents(id)
            )
        """)
        
        # Such-Index
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_agent_type ON agents(type)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_agent_tags ON agents(tags)
        """)
        
        conn.commit()
        conn.close()
        
    def register(self, agent: BaseAgent) -> bool:
        """
        Registriere einen Agenten
        
        Args:
            agent: Der zu registrierende Agent
            
        Returns:
            True wenn erfolgreich, False wenn Agent bereits existiert
        """
        if agent.metadata.name in self.agents:
            return False
            
        # In Memory speichern
        self.agents[agent.metadata.name] = agent
        self.metadata_cache[agent.metadata.name] = agent.get_info()
        
        # In Datenbank persistieren
        self._persist_agent(agent)
        
        # Beziehungen speichern
        self._persist_relationships(agent)
        
        return True
        
    def unregister(self, agent_name: str) -> bool:
        """
        Entferne einen Agenten aus der Registry
        
        Args:
            agent_name: Name des Agenten
            
        Returns:
            True wenn erfolgreich entfernt
        """
        if agent_name not in self.agents:
            return False
            
        # Aus Memory entfernen
        del self.agents[agent_name]
        if agent_name in self.metadata_cache:
            del self.metadata_cache[agent_name]
            
        # Aus Datenbank entfernen
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        
        # Hole Agent ID
        cursor.execute("SELECT id FROM agents WHERE name = ?", (agent_name,))
        result = cursor.fetchone()
        if result:
            agent_id = result[0]
            
            # Entferne Beziehungen
            cursor.execute("DELETE FROM agent_relationships WHERE parent_id = ? OR child_id = ?", 
                         (agent_id, agent_id))
            
            # Entferne Agent
            cursor.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
            
        conn.commit()
        conn.close()
        
        return True
        
    def get(self, agent_name: str) -> Optional[BaseAgent]:
        """
        Hole einen Agenten nach Name
        
        Args:
            agent_name: Name des Agenten
            
        Returns:
            Der Agent oder None
        """
        return self.agents.get(agent_name)
        
    def exists(self, agent_name: str) -> bool:
        """
        Prüfe ob ein Agent existiert
        
        Args:
            agent_name: Name des Agenten
            
        Returns:
            True wenn Agent existiert
        """
        return agent_name in self.agents
        
    def list_agents(self, 
                   agent_type: Optional[AgentType] = None,
                   tags: Optional[List[str]] = None) -> List[str]:
        """
        Liste Agenten nach Kriterien
        
        Args:
            agent_type: Filtere nach Agent-Typ
            tags: Filtere nach Tags
            
        Returns:
            Liste von Agent-Namen
        """
        result = []
        
        for name, agent in self.agents.items():
            # Type-Filter
            if agent_type and agent.agent_type != agent_type:
                continue
                
            # Tag-Filter
            if tags:
                agent_tags = set(agent.metadata.tags)
                if not any(tag in agent_tags for tag in tags):
                    continue
                    
            result.append(name)
            
        return sorted(result)
        
    def search(self, query: str) -> List[str]:
        """
        Suche Agenten nach Query
        
        Args:
            query: Suchbegriff
            
        Returns:
            Liste von Agent-Namen die matchen
        """
        query_lower = query.lower()
        results = []
        
        for name, agent in self.agents.items():
            # Suche in Name
            if query_lower in name.lower():
                results.append(name)
                continue
                
            # Suche in Beschreibung
            if query_lower in agent.metadata.description.lower():
                results.append(name)
                continue
                
            # Suche in Tags
            if any(query_lower in tag.lower() for tag in agent.metadata.tags):
                results.append(name)
                
        return sorted(results)
        
    def get_children(self, agent_name: str) -> List[str]:
        """
        Hole alle Kind-Agenten eines Agenten
        
        Args:
            agent_name: Name des Parent-Agenten
            
        Returns:
            Liste von Kind-Agent Namen
        """
        agent = self.get(agent_name)
        if not agent:
            return []
            
        return [child.metadata.name for child in agent.context.child_agents]
        
    def get_parent(self, agent_name: str) -> Optional[str]:
        """
        Hole den Parent-Agent eines Agenten
        
        Args:
            agent_name: Name des Kind-Agenten
            
        Returns:
            Name des Parent-Agenten oder None
        """
        agent = self.get(agent_name)
        if not agent or not agent.context.parent_agent:
            return None
            
        return agent.context.parent_agent.metadata.name
        
    def get_hierarchy(self, agent_name: str) -> Dict[str, Any]:
        """
        Hole die komplette Hierarchie eines Agenten
        
        Args:
            agent_name: Name des Agenten
            
        Returns:
            Hierarchie-Struktur
        """
        agent = self.get(agent_name)
        if not agent:
            return {}
            
        def build_hierarchy(agent: BaseAgent) -> Dict[str, Any]:
            return {
                'name': agent.metadata.name,
                'type': agent.agent_type.name,
                'children': [
                    build_hierarchy(child) for child in agent.context.child_agents
                ]
            }
            
        return build_hierarchy(agent)
        
    def get_statistics(self) -> Dict[str, Any]:
        """
        Hole Statistiken über die Registry
        
        Returns:
            Statistik-Dictionary
        """
        type_counts = {}
        for agent in self.agents.values():
            type_name = agent.agent_type.name
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
            
        # Beziehungs-Statistiken
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM agent_relationships")
        relationship_count = cursor.fetchone()[0]
        conn.close()
        
        return {
            'total_agents': len(self.agents),
            'by_type': type_counts,
            'total_relationships': relationship_count,
            'memory_agents': len(self.agents),
            'cached_metadata': len(self.metadata_cache)
        }
        
    def export_registry(self, export_path: str, format: str = 'json'):
        """
        Exportiere die komplette Registry
        
        Args:
            export_path: Pfad für Export-Datei
            format: Export-Format ('json' oder 'yaml')
        """
        export_data = {
            'exported_at': datetime.now().isoformat(),
            'statistics': self.get_statistics(),
            'agents': []
        }
        
        for agent in self.agents.values():
            agent_data = {
                'name': agent.metadata.name,
                'type': agent.agent_type.name,
                'description': agent.metadata.description,
                'version': agent.metadata.version,
                'created_at': agent.metadata.created_at.isoformat(),
                'tags': agent.metadata.tags,
                'parent': self.get_parent(agent.metadata.name),
                'children': self.get_children(agent.metadata.name)
            }
            export_data['agents'].append(agent_data)
            
        # Schreibe Export
        with open(export_path, 'w', encoding='utf-8') as f:
            if format == 'json':
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            elif format == 'yaml':
                import yaml
                yaml.dump(export_data, f, default_flow_style=False, allow_unicode=True)
                
    def _persist_agent(self, agent: BaseAgent):
        """Persistiere einen Agenten in der Datenbank"""
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        
        # Serialisiere Agent (vereinfacht - in Produktion würde man ein besseres Format verwenden)
        try:
            serialized = pickle.dumps(agent)
        except:
            # Fallback: Speichere nur Metadaten
            serialized = b''
            
        metadata = json.dumps(agent.get_info())
        
        cursor.execute("""
            INSERT OR REPLACE INTO agents 
            (id, name, type, description, version, created_at, updated_at, author, tags, serialized_agent, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            agent.metadata.id,
            agent.metadata.name,
            agent.agent_type.name,
            agent.metadata.description,
            agent.metadata.version,
            agent.metadata.created_at,
            agent.metadata.updated_at,
            agent.metadata.author,
            json.dumps(agent.metadata.tags),
            serialized,
            metadata
        ))
        
        conn.commit()
        conn.close()
        
    def _persist_relationships(self, agent: BaseAgent):
        """Persistiere Agent-Beziehungen"""
        if not agent.context.child_agents:
            return
            
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        
        for child in agent.context.child_agents:
            cursor.execute("""
                INSERT OR REPLACE INTO agent_relationships
                (parent_id, child_id, relationship_type, created_at)
                VALUES (?, ?, ?, ?)
            """, (
                agent.metadata.id,
                child.metadata.id,
                'parent_child',
                datetime.now()
            ))
            
        conn.commit()
        conn.close()
        
    def _load_agents(self):
        """Lade Agenten aus der Datenbank"""
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name, serialized_agent, metadata FROM agents")
        
        for row in cursor.fetchall():
            name, serialized, metadata_str = row
            
            # Versuche Agent zu deserialisieren
            if serialized:
                try:
                    agent = pickle.loads(serialized)
                    self.agents[name] = agent
                except:
                    # Fallback: Nur Metadaten laden
                    pass
                    
            # Cache Metadaten
            if metadata_str:
                self.metadata_cache[name] = json.loads(metadata_str)
                
        conn.close()
        
    def cleanup_orphaned(self) -> int:
        """
        Bereinige verwaiste Einträge
        
        Returns:
            Anzahl der bereinigten Einträge
        """
        conn = sqlite3.connect(self.storage_path)
        cursor = conn.cursor()
        
        # Finde verwaiste Beziehungen
        cursor.execute("""
            DELETE FROM agent_relationships
            WHERE parent_id NOT IN (SELECT id FROM agents)
            OR child_id NOT IN (SELECT id FROM agents)
        """)
        
        cleaned = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return cleaned