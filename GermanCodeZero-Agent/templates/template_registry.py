"""
Template Registry - Verwaltung aller Agent-Templates
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import yaml
import json
from datetime import datetime


class TemplateRegistry:
    """
    Zentrale Registry für alle Agent-Templates
    """
    
    def __init__(self, template_path: str = "/workspace/GermanCodeZero-Agent/templates"):
        """
        Initialisiere Template-Registry
        
        Args:
            template_path: Basis-Pfad zu den Templates
        """
        self.template_path = Path(template_path)
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.categories: Dict[str, List[str]] = {}
        self.load_all_templates()
        
    def load_all_templates(self):
        """Lade alle Templates aus dem Dateisystem"""
        for level in ['nano', 'mikro', 'sub', 'domain', 'enterprise']:
            level_path = self.template_path / level
            
            if level_path.exists():
                for template_file in level_path.glob("*.yaml"):
                    self._load_template_file(template_file, level)
                    
    def _load_template_file(self, file_path: Path, level: str):
        """Lade ein einzelnes Template-File"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
                
            # Registriere Templates
            if 'templates' in content:
                # Multiple Templates in einer Datei
                for template in content['templates']:
                    self._register_template(template, level, content.get('category', 'general'))
            elif 'template' in content:
                # Single Template
                self._register_template(content['template'], level, content.get('category', 'general'))
                
        except Exception as e:
            print(f"Fehler beim Laden von {file_path}: {e}")
            
    def _register_template(self, template: Dict[str, Any], level: str, category: str):
        """Registriere ein einzelnes Template"""
        template_id = f"{level}/{template['name']}"
        
        # Erweitere Template mit Metadaten
        template['_metadata'] = {
            'id': template_id,
            'level': level,
            'category': category,
            'registered_at': datetime.now().isoformat()
        }
        
        # Speichere Template
        self.templates[template_id] = template
        
        # Kategorisiere
        if category not in self.categories:
            self.categories[category] = []
        self.categories[category].append(template_id)
        
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Hole ein Template nach ID
        
        Args:
            template_id: Template-ID (z.B. "nano/imap_connect")
            
        Returns:
            Template-Dictionary oder None
        """
        return self.templates.get(template_id)
        
    def get_templates_by_level(self, level: str) -> List[Dict[str, Any]]:
        """
        Hole alle Templates einer Hierarchiestufe
        
        Args:
            level: Agent-Level (nano, mikro, sub, domain, enterprise)
            
        Returns:
            Liste von Templates
        """
        return [
            template for tid, template in self.templates.items()
            if template['_metadata']['level'] == level
        ]
        
    def get_templates_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Hole alle Templates einer Kategorie
        
        Args:
            category: Kategorie-Name
            
        Returns:
            Liste von Templates
        """
        template_ids = self.categories.get(category, [])
        return [self.templates[tid] for tid in template_ids if tid in self.templates]
        
    def search_templates(self, query: str) -> List[Dict[str, Any]]:
        """
        Suche Templates nach Stichwort
        
        Args:
            query: Suchbegriff
            
        Returns:
            Liste von passenden Templates
        """
        query_lower = query.lower()
        results = []
        
        for template in self.templates.values():
            # Suche in Name und Beschreibung
            if (query_lower in template.get('name', '').lower() or
                query_lower in template.get('description', '').lower()):
                results.append(template)
                
        return results
        
    def get_template_hierarchy(self, enterprise_template_id: str) -> Dict[str, Any]:
        """
        Hole die komplette Hierarchie ausgehend von einem Enterprise-Template
        
        Args:
            enterprise_template_id: ID des Enterprise-Templates
            
        Returns:
            Hierarchie-Struktur
        """
        template = self.get_template(enterprise_template_id)
        if not template or template['_metadata']['level'] != 'enterprise':
            return {}
            
        hierarchy = {
            'enterprise': template,
            'domains': [],
            'subs': [],
            'mikros': [],
            'nanos': []
        }
        
        # Traversiere Hierarchie (vereinfacht)
        # In Produktion würde man die Referenzen auflösen
        
        return hierarchy
        
    def validate_template(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validiere ein Template
        
        Args:
            template: Template-Dictionary
            
        Returns:
            Validierungs-Ergebnis
        """
        errors = []
        warnings = []
        
        # Pflichtfelder prüfen
        required_fields = ['name', 'type', 'description']
        for field in required_fields:
            if field not in template:
                errors.append(f"Pflichtfeld '{field}' fehlt")
                
        # Typ-spezifische Validierung
        template_type = template.get('type', '').lower()
        
        if template_type == 'nano':
            if 'action_type' not in template and 'action' not in template:
                errors.append("Nano-Template benötigt 'action_type' oder 'action'")
                
        elif template_type == 'mikro':
            if 'nano_agents' not in template:
                errors.append("Mikro-Template benötigt 'nano_agents'")
                
        elif template_type == 'sub':
            if 'mikro_agents' not in template:
                errors.append("Sub-Template benötigt 'mikro_agents'")
            if 'decision_logic' not in template:
                warnings.append("Sub-Template ohne 'decision_logic' hat eingeschränkte Funktionalität")
                
        elif template_type == 'domain':
            if 'sub_agents' not in template:
                errors.append("Domain-Template benötigt 'sub_agents'")
            if 'policies' not in template:
                warnings.append("Domain-Template ohne 'policies' ist nicht empfohlen")
                
        elif template_type == 'enterprise':
            if 'domain_agents' not in template:
                errors.append("Enterprise-Template benötigt 'domain_agents'")
            if 'compliance_requirements' not in template:
                warnings.append("Enterprise-Template sollte 'compliance_requirements' definieren")
                
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
        
    def export_template(self, template_id: str, format: str = 'yaml') -> str:
        """
        Exportiere ein Template
        
        Args:
            template_id: Template-ID
            format: Export-Format ('yaml' oder 'json')
            
        Returns:
            Exportierter String
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template '{template_id}' nicht gefunden")
            
        # Entferne interne Metadaten für Export
        export_data = {k: v for k, v in template.items() if not k.startswith('_')}
        
        if format == 'yaml':
            return yaml.dump(export_data, default_flow_style=False, allow_unicode=True)
        elif format == 'json':
            return json.dumps(export_data, indent=2, ensure_ascii=False)
        else:
            raise ValueError(f"Unbekanntes Format: {format}")
            
    def create_custom_template(self, base_template_id: str, 
                             customizations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Erstelle ein angepasstes Template basierend auf einem Basis-Template
        
        Args:
            base_template_id: ID des Basis-Templates
            customizations: Anpassungen
            
        Returns:
            Neues Template
        """
        base = self.get_template(base_template_id)
        if not base:
            raise ValueError(f"Basis-Template '{base_template_id}' nicht gefunden")
            
        # Deep copy des Basis-Templates
        import copy
        custom = copy.deepcopy(base)
        
        # Wende Anpassungen an
        for key, value in customizations.items():
            if isinstance(value, dict) and key in custom and isinstance(custom[key], dict):
                # Merge dictionaries
                custom[key].update(value)
            else:
                # Überschreibe Wert
                custom[key] = value
                
        # Neuer Name
        custom['name'] = customizations.get('name', f"{base['name']}_custom")
        custom['_metadata']['custom'] = True
        custom['_metadata']['base_template'] = base_template_id
        
        return custom
        
    def get_statistics(self) -> Dict[str, Any]:
        """
        Hole Statistiken über die Registry
        
        Returns:
            Statistik-Dictionary
        """
        stats = {
            'total_templates': len(self.templates),
            'by_level': {},
            'by_category': {cat: len(ids) for cat, ids in self.categories.items()},
            'validation_stats': {
                'valid': 0,
                'with_warnings': 0,
                'invalid': 0
            }
        }
        
        # Zähle nach Level
        for template in self.templates.values():
            level = template['_metadata']['level']
            stats['by_level'][level] = stats['by_level'].get(level, 0) + 1
            
            # Validiere
            validation = self.validate_template(template)
            if validation['valid']:
                if validation['warnings']:
                    stats['validation_stats']['with_warnings'] += 1
                else:
                    stats['validation_stats']['valid'] += 1
            else:
                stats['validation_stats']['invalid'] += 1
                
        return stats
        
    def generate_documentation(self) -> str:
        """
        Generiere Dokumentation für alle Templates
        
        Returns:
            Markdown-Dokumentation
        """
        doc = "# GermanCodeZero-Agent Template-Katalog\n\n"
        doc += f"Generiert am: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Statistiken
        stats = self.get_statistics()
        doc += "## Übersicht\n\n"
        doc += f"- **Gesamt-Templates**: {stats['total_templates']}\n"
        doc += f"- **Nach Level**: {stats['by_level']}\n"
        doc += f"- **Kategorien**: {len(stats['by_category'])}\n\n"
        
        # Templates nach Level
        for level in ['nano', 'mikro', 'sub', 'domain', 'enterprise']:
            templates = self.get_templates_by_level(level)
            if templates:
                doc += f"## {level.title()}-Templates\n\n"
                
                for template in templates:
                    doc += f"### {template['name']}\n"
                    doc += f"- **Beschreibung**: {template.get('description', 'N/A')}\n"
                    doc += f"- **Kategorie**: {template['_metadata']['category']}\n"
                    
                    if level == 'nano' and 'action_type' in template:
                        doc += f"- **Action-Type**: {template['action_type']}\n"
                    elif level == 'mikro' and 'pipeline_mode' in template:
                        doc += f"- **Pipeline-Mode**: {template['pipeline_mode']}\n"
                    elif level == 'enterprise' and 'industry' in template:
                        doc += f"- **Branche**: {template['industry']}\n"
                        
                    doc += "\n"
                    
        return doc


# Singleton-Instanz
_registry_instance = None

def get_template_registry() -> TemplateRegistry:
    """Hole die globale Template-Registry Instanz"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = TemplateRegistry()
    return _registry_instance