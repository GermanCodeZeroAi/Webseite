"""
Agent-Builder: Intelligentes System zum Erstellen von Agenten aller Hierarchiestufen
"""

import asyncio
from typing import Any, Dict, List, Optional, Union, Type
from datetime import datetime
import json
import yaml
from pathlib import Path

from .base_agent import BaseAgent, AgentType, AgentMetadata
from .nano_agent import NanoAgent, NanoAgentFactory
from .mikro_agent import MikroAgent, MikroAgentTemplates
from .sub_agent import SubAgent
from .domain_agent import DomainAgent, DomainType
from .enterprise_agent import EnterpriseAgent, Industry


class AgentBuilder:
    """
    Der zentrale Builder für alle Agent-Hierarchiestufen.
    
    Kann intelligent Agenten von Nano bis Enterprise erstellen,
    basierend auf Beschreibungen, Templates und vorhandenen Bausteinen.
    """
    
    def __init__(self, knowledge_base_path: Optional[str] = None):
        """
        Initialisiere den Agent-Builder
        
        Args:
            knowledge_base_path: Pfad zur Wissensdatenbank mit Templates und Patterns
        """
        self.knowledge_base_path = knowledge_base_path or "/workspace/GermanCodeZero-Agent/knowledge"
        self.agent_registry = {}  # Registrierte Agenten
        self.templates = {}       # Agent-Templates
        self.patterns = {}        # Design Patterns
        self.policies = {}        # Policy-Bibliothek
        
        # Lade Wissensbasis
        self._load_knowledge_base()
        
        # Builder-Statistiken
        self.stats = {
            'agents_created': 0,
            'nano_agents': 0,
            'mikro_agents': 0,
            'sub_agents': 0,
            'domain_agents': 0,
            'enterprise_agents': 0,
            'creation_history': []
        }
        
    def _load_knowledge_base(self):
        """Lade Templates, Patterns und Policies aus der Wissensbasis"""
        kb_path = Path(self.knowledge_base_path)
        
        # Lade Templates
        templates_path = kb_path / "templates"
        if templates_path.exists():
            for template_file in templates_path.glob("*.yaml"):
                with open(template_file, 'r', encoding='utf-8') as f:
                    template_data = yaml.safe_load(f)
                    self.templates[template_data['name']] = template_data
                    
        # Lade Patterns
        patterns_path = kb_path / "patterns"
        if patterns_path.exists():
            for pattern_file in patterns_path.glob("*.yaml"):
                with open(pattern_file, 'r', encoding='utf-8') as f:
                    pattern_data = yaml.safe_load(f)
                    self.patterns[pattern_data['name']] = pattern_data
                    
        # Lade Policies
        policies_path = kb_path / "policies"
        if policies_path.exists():
            for policy_file in policies_path.glob("*.yaml"):
                with open(policy_file, 'r', encoding='utf-8') as f:
                    policy_data = yaml.safe_load(f)
                    self.policies[policy_data['name']] = policy_data
                    
    async def build_agent(self, specification: Dict[str, Any]) -> BaseAgent:
        """
        Baue einen Agenten basierend auf Spezifikation
        
        Args:
            specification: Agent-Spezifikation mit type, name, etc.
            
        Returns:
            Der erstellte Agent
        """
        agent_type = specification.get('type', '').lower()
        
        if agent_type == 'nano':
            return await self.build_nano_agent(specification)
        elif agent_type == 'mikro':
            return await self.build_mikro_agent(specification)
        elif agent_type == 'sub':
            return await self.build_sub_agent(specification)
        elif agent_type == 'domain':
            return await self.build_domain_agent(specification)
        elif agent_type == 'enterprise':
            return await self.build_enterprise_agent(specification)
        else:
            # Intelligente Typ-Erkennung
            return await self._auto_detect_and_build(specification)
            
    async def build_nano_agent(self, spec: Dict[str, Any]) -> NanoAgent:
        """
        Baue einen Nano-Agent
        
        Spec-Format:
        {
            'name': 'agent_name',
            'action': 'action_type' oder callable,
            'description': 'Was der Agent tut',
            'input_schema': {...},
            'output_schema': {...}
        }
        """
        name = spec.get('name', f'nano_agent_{self.stats["nano_agents"]}')
        
        # Verwende Factory wenn Action-Type bekannt
        action_type = spec.get('action_type')
        if action_type == 'db_write':
            agent = NanoAgentFactory.create_db_write_agent(
                spec.get('table_name', 'default_table'),
                spec.get('connection_params', {})
            )
        elif action_type == 'api_call':
            agent = NanoAgentFactory.create_api_call_agent(
                spec.get('endpoint', '/default'),
                spec.get('method', 'GET')
            )
        elif action_type == 'file_operation':
            agent = NanoAgentFactory.create_file_operation_agent(
                spec.get('operation', 'read')
            )
        else:
            # Erstelle Custom Nano-Agent
            action = spec.get('action')
            if not action:
                # Generiere Action basierend auf Beschreibung
                action = self._generate_nano_action(spec)
                
            agent = NanoAgent(
                name=name,
                action=action,
                description=spec.get('description', ''),
                input_schema=spec.get('input_schema'),
                output_schema=spec.get('output_schema')
            )
            
        # Registriere Agent
        self._register_agent(agent)
        self.stats['nano_agents'] += 1
        
        return agent
        
    async def build_mikro_agent(self, spec: Dict[str, Any]) -> MikroAgent:
        """
        Baue einen Mikro-Agent aus Nano-Agenten
        
        Spec-Format:
        {
            'name': 'agent_name',
            'description': 'Was das Modul tut',
            'nano_agents': [...],  # Liste von Nano-Specs oder Namen
            'pipeline_mode': 'sequential' oder 'parallel',
            'template': 'template_name'  # Optional
        }
        """
        name = spec.get('name', f'mikro_agent_{self.stats["mikro_agents"]}')
        
        # Verwende Template wenn angegeben
        template_name = spec.get('template')
        if template_name:
            if template_name == 'mail_processor':
                agent = MikroAgentTemplates.create_mail_processor()
            elif template_name == 'document_analyzer':
                agent = MikroAgentTemplates.create_document_analyzer()
            else:
                # Lade aus Template-Bibliothek
                agent = await self._build_from_template('mikro', template_name, spec)
        else:
            # Baue Nano-Agenten
            nano_agents = []
            for nano_spec in spec.get('nano_agents', []):
                if isinstance(nano_spec, str):
                    # Verwende existierenden Nano-Agent
                    nano = self.agent_registry.get(nano_spec)
                    if not nano:
                        raise ValueError(f"Nano-Agent '{nano_spec}' nicht gefunden")
                else:
                    # Baue neuen Nano-Agent
                    nano = await self.build_nano_agent(nano_spec)
                nano_agents.append(nano)
                
            agent = MikroAgent(
                name=name,
                nano_agents=nano_agents,
                description=spec.get('description', ''),
                pipeline_mode=spec.get('pipeline_mode', 'sequential')
            )
            
        # Registriere Agent
        self._register_agent(agent)
        self.stats['mikro_agents'] += 1
        
        return agent
        
    async def build_sub_agent(self, spec: Dict[str, Any]) -> SubAgent:
        """
        Baue einen Sub-Agent mit Entscheidungslogik
        
        Spec-Format:
        {
            'name': 'agent_name',
            'description': 'Teilprozess-Beschreibung',
            'mikro_agents': [...],  # Liste von Mikro-Specs oder Namen
            'workflows': {...},     # Workflow-Definitionen
            'conditions': [...],    # Bedingte Flows
            'decision_logic': {...},
            'error_handlers': {...}
        }
        """
        name = spec.get('name', f'sub_agent_{self.stats["sub_agents"]}')
        
        agent = SubAgent(
            name=name,
            description=spec.get('description', ''),
            decision_logic=spec.get('decision_logic', {})
        )
        
        # Füge Mikro-Agenten hinzu
        for mikro_spec in spec.get('mikro_agents', []):
            if isinstance(mikro_spec, str):
                mikro = self.agent_registry.get(mikro_spec)
                if not mikro:
                    raise ValueError(f"Mikro-Agent '{mikro_spec}' nicht gefunden")
            else:
                mikro = await self.build_mikro_agent(mikro_spec)
            agent.add_mikro_agent(mikro)
            
        # Definiere Workflows
        for workflow_name, steps in spec.get('workflows', {}).items():
            agent.define_workflow(workflow_name, steps)
            
        # Füge bedingte Flows hinzu
        for condition_spec in spec.get('conditions', []):
            condition = self._create_condition_function(condition_spec)
            true_agent = self.agent_registry.get(condition_spec['true_agent'])
            false_agent = self.agent_registry.get(condition_spec.get('false_agent'))
            
            if true_agent:
                agent.add_conditional_flow(condition, true_agent, false_agent)
                
        # Setze Error-Handler
        for error_type, handler_spec in spec.get('error_handlers', {}).items():
            handler = self._create_error_handler(handler_spec)
            agent.set_error_handler(error_type, handler)
            
        # Registriere Agent
        self._register_agent(agent)
        self.stats['sub_agents'] += 1
        
        return agent
        
    async def build_domain_agent(self, spec: Dict[str, Any]) -> DomainAgent:
        """
        Baue einen Domain-Agent für einen Fachbereich
        
        Spec-Format:
        {
            'name': 'agent_name',
            'domain_type': 'mail_ops', 'calendar_ops', etc.,
            'description': 'Fachbereichs-Beschreibung',
            'sub_agents': [...],    # Liste von Sub-Specs oder Namen
            'policies': {...},      # Domain-Policies
            'integrations': [...],  # System-Integrationen
            'routing_rules': {...}  # Capability-basiertes Routing
        }
        """
        name = spec.get('name', f'domain_agent_{self.stats["domain_agents"]}')
        
        # Bestimme Domain-Typ
        domain_type_str = spec.get('domain_type', 'custom')
        domain_type = DomainType[domain_type_str.upper()] if hasattr(DomainType, domain_type_str.upper()) else DomainType.CUSTOM
        
        agent = DomainAgent(
            name=name,
            domain_type=domain_type,
            description=spec.get('description', ''),
            policies=spec.get('policies', {}),
            integrations=spec.get('integrations', [])
        )
        
        # Füge Sub-Agenten hinzu
        for sub_spec in spec.get('sub_agents', []):
            if isinstance(sub_spec, dict):
                # Spec mit Capabilities
                sub_agent_ref = sub_spec.get('agent')
                capabilities = sub_spec.get('capabilities', [])
                
                if isinstance(sub_agent_ref, str):
                    sub_agent = self.agent_registry.get(sub_agent_ref)
                    if not sub_agent:
                        raise ValueError(f"Sub-Agent '{sub_agent_ref}' nicht gefunden")
                else:
                    sub_agent = await self.build_sub_agent(sub_agent_ref)
                    
                agent.add_sub_agent(sub_agent, capabilities)
                
        # Setze Domain-Wissen
        for key, knowledge in spec.get('domain_knowledge', {}).items():
            agent.set_domain_knowledge(key, knowledge)
            
        # Registriere Agent
        self._register_agent(agent)
        self.stats['domain_agents'] += 1
        
        return agent
        
    async def build_enterprise_agent(self, spec: Dict[str, Any]) -> EnterpriseAgent:
        """
        Baue einen Enterprise-Agent als Komplettlösung
        
        Spec-Format:
        {
            'name': 'agent_name',
            'industry': 'healthcare', 'legal', etc.,
            'company_name': 'Firmenname',
            'description': 'Lösungs-Beschreibung',
            'domain_agents': [...],     # Liste von Domain-Specs oder Namen
            'business_processes': {...}, # Geschäftsprozess-Definitionen
            'global_policies': {...},    # Unternehmensweite Policies
            'compliance': [...],         # Compliance-Anforderungen
            'integrations': {...}        # Enterprise-Integrationen
        }
        """
        name = spec.get('name', f'enterprise_agent_{self.stats["enterprise_agents"]}')
        
        # Bestimme Branche
        industry_str = spec.get('industry', 'custom')
        industry = Industry[industry_str.upper()] if hasattr(Industry, industry_str.upper()) else Industry.CUSTOM
        
        agent = EnterpriseAgent(
            name=name,
            industry=industry,
            company_name=spec.get('company_name', 'Default Company'),
            description=spec.get('description', ''),
            global_policies=spec.get('global_policies', {}),
            compliance_requirements=spec.get('compliance', [])
        )
        
        # Füge Domain-Agenten hinzu
        for domain_spec in spec.get('domain_agents', []):
            if isinstance(domain_spec, str):
                domain = self.agent_registry.get(domain_spec)
                if not domain:
                    raise ValueError(f"Domain-Agent '{domain_spec}' nicht gefunden")
            else:
                domain = await self.build_domain_agent(domain_spec)
            agent.add_domain_agent(domain)
            
        # Definiere Geschäftsprozesse
        for process_name, process_flow in spec.get('business_processes', {}).items():
            agent.define_business_process(process_name, process_flow)
            
        # Setze Orchestrierungs-Regeln
        for rule_name, rule_def in spec.get('orchestration_rules', {}).items():
            agent.set_orchestration_rule(rule_name, rule_def)
            
        # Füge Integrationen hinzu
        for integration_type, integrations in spec.get('integrations', {}).items():
            for int_name, int_config in integrations.items():
                agent.add_integration(integration_type, int_name, int_config)
                
        # Registriere Agent
        self._register_agent(agent)
        self.stats['enterprise_agents'] += 1
        
        return agent
        
    async def _auto_detect_and_build(self, spec: Dict[str, Any]) -> BaseAgent:
        """
        Erkenne automatisch den Agent-Typ und baue entsprechend
        """
        # Analysiere Spec um Typ zu bestimmen
        if 'action' in spec or 'action_type' in spec:
            return await self.build_nano_agent(spec)
        elif 'nano_agents' in spec:
            return await self.build_mikro_agent(spec)
        elif 'mikro_agents' in spec or 'workflows' in spec:
            return await self.build_sub_agent(spec)
        elif 'sub_agents' in spec or 'domain_type' in spec:
            return await self.build_domain_agent(spec)
        elif 'domain_agents' in spec or 'industry' in spec:
            return await self.build_enterprise_agent(spec)
        else:
            # Fallback: Baue basierend auf Beschreibung
            return await self._build_from_description(spec)
            
    async def _build_from_description(self, spec: Dict[str, Any]) -> BaseAgent:
        """
        Baue Agent basierend auf natürlichsprachlicher Beschreibung
        """
        description = spec.get('description', '').lower()
        
        # Einfache Keyword-basierte Erkennung
        if any(word in description for word in ['einzeln', 'befehl', 'aktion']):
            spec['type'] = 'nano'
        elif any(word in description for word in ['modul', 'kombination', 'pipeline']):
            spec['type'] = 'mikro'
        elif any(word in description for word in ['prozess', 'workflow', 'entscheidung']):
            spec['type'] = 'sub'
        elif any(word in description for word in ['fachbereich', 'domain', 'bereich']):
            spec['type'] = 'domain'
        elif any(word in description for word in ['unternehmen', 'enterprise', 'komplett']):
            spec['type'] = 'enterprise'
        else:
            # Default: Nano-Agent
            spec['type'] = 'nano'
            
        return await self.build_agent(spec)
        
    async def _build_from_template(self, agent_type: str, template_name: str, 
                                  spec: Dict[str, Any]) -> BaseAgent:
        """
        Baue Agent aus Template
        """
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' nicht gefunden")
            
        template = self.templates[template_name].copy()
        
        # Merge Spec mit Template
        for key, value in spec.items():
            if key != 'template':
                template[key] = value
                
        # Baue Agent
        template['type'] = agent_type
        return await self.build_agent(template)
        
    def _generate_nano_action(self, spec: Dict[str, Any]) -> callable:
        """
        Generiere eine Nano-Action basierend auf Beschreibung
        """
        # In Produktion würde hier ein LLM Code generieren
        # Für Demo: Einfache Dummy-Action
        
        async def generated_action(**kwargs):
            return {
                'action': spec.get('name', 'generated'),
                'input': kwargs,
                'timestamp': datetime.now().isoformat()
            }
            
        return generated_action
        
    def _create_condition_function(self, condition_spec: Dict[str, Any]) -> callable:
        """
        Erstelle eine Bedingungsfunktion aus Spec
        """
        field = condition_spec.get('field')
        operator = condition_spec.get('operator', '==')
        value = condition_spec.get('value')
        
        def condition(context: Dict[str, Any]) -> bool:
            if field not in context:
                return False
                
            field_value = context[field]
            
            if operator == '==':
                return field_value == value
            elif operator == '!=':
                return field_value != value
            elif operator == '>':
                return field_value > value
            elif operator == '<':
                return field_value < value
            elif operator == 'in':
                return field_value in value
            elif operator == 'contains':
                return value in str(field_value)
            else:
                return False
                
        return condition
        
    def _create_error_handler(self, handler_spec: Dict[str, Any]) -> callable:
        """
        Erstelle einen Error-Handler aus Spec
        """
        handler_type = handler_spec.get('type', 'log')
        
        async def error_handler(error: Exception, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
            if handler_type == 'retry':
                # Retry-Logic
                return {'retry': True, 'delay': handler_spec.get('delay', 1)}
            elif handler_type == 'fallback':
                # Fallback zu anderem Agent
                fallback_agent = handler_spec.get('fallback_agent')
                if fallback_agent:
                    return {'fallback': fallback_agent}
            elif handler_type == 'recover':
                # Recovery-Strategie
                return {'recovered': True, 'recovery_data': handler_spec.get('recovery_data', {})}
            else:
                # Default: Nur loggen
                return None
                
        return error_handler
        
    def _register_agent(self, agent: BaseAgent):
        """
        Registriere einen erstellten Agenten
        """
        self.agent_registry[agent.metadata.name] = agent
        self.stats['agents_created'] += 1
        self.stats['creation_history'].append({
            'timestamp': datetime.now(),
            'agent_name': agent.metadata.name,
            'agent_type': agent.agent_type.name
        })
        
    def get_agent(self, name: str) -> Optional[BaseAgent]:
        """
        Hole einen registrierten Agenten
        """
        return self.agent_registry.get(name)
        
    def list_agents(self, agent_type: Optional[AgentType] = None) -> List[str]:
        """
        Liste alle registrierten Agenten
        """
        if agent_type:
            return [
                name for name, agent in self.agent_registry.items()
                if agent.agent_type == agent_type
            ]
        return list(self.agent_registry.keys())
        
    def export_agent(self, agent_name: str, format: str = 'yaml') -> str:
        """
        Exportiere einen Agenten als YAML oder JSON
        """
        agent = self.agent_registry.get(agent_name)
        if not agent:
            raise ValueError(f"Agent '{agent_name}' nicht gefunden")
            
        export_data = {
            'name': agent.metadata.name,
            'type': agent.agent_type.name,
            'description': agent.metadata.description,
            'metadata': {
                'id': agent.metadata.id,
                'version': agent.metadata.version,
                'created_at': agent.metadata.created_at.isoformat(),
                'author': agent.metadata.author
            }
        }
        
        # Füge typ-spezifische Daten hinzu
        if isinstance(agent, EnterpriseAgent):
            export_data.update({
                'industry': agent.industry.value,
                'company_name': agent.company_name,
                'domains': list(agent.domain_agents.keys()),
                'business_processes': list(agent.business_processes.keys()),
                'compliance': list(agent.compliance_requirements)
            })
        elif isinstance(agent, DomainAgent):
            export_data.update({
                'domain_type': agent.domain_type.value,
                'sub_agents': list(agent.sub_agents.keys()),
                'policies': list(agent.policies.keys()),
                'integrations': list(agent.integrations)
            })
        # ... weitere Typen
        
        if format == 'yaml':
            return yaml.dump(export_data, default_flow_style=False, allow_unicode=True)
        else:
            return json.dumps(export_data, indent=2, ensure_ascii=False)
            
    def get_builder_stats(self) -> Dict[str, Any]:
        """
        Gibt Statistiken über den Builder zurück
        """
        return {
            'total_agents': self.stats['agents_created'],
            'by_type': {
                'nano': self.stats['nano_agents'],
                'mikro': self.stats['mikro_agents'],
                'sub': self.stats['sub_agents'],
                'domain': self.stats['domain_agents'],
                'enterprise': self.stats['enterprise_agents']
            },
            'templates_loaded': len(self.templates),
            'patterns_loaded': len(self.patterns),
            'policies_loaded': len(self.policies),
            'registry_size': len(self.agent_registry),
            'recent_creations': self.stats['creation_history'][-10:]
        }