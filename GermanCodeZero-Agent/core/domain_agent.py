"""
Domain-Agent: Kompletter Fachbereich
"""

from typing import Any, Dict, List, Optional, Set
import asyncio
from enum import Enum
from .base_agent import BaseAgent, AgentType, AgentMetadata
from .sub_agent import SubAgent

class DomainType(Enum):
    """Vordefinierte Fachbereiche"""
    MAIL_OPS = "mail_operations"
    CALENDAR_OPS = "calendar_operations"
    COMPLIANCE_OPS = "compliance_operations"
    FINANCE_OPS = "finance_operations"
    HR_OPS = "human_resources"
    CUSTOMER_OPS = "customer_service"
    DOCUMENT_OPS = "document_management"
    CUSTOM = "custom"

class DomainAgent(BaseAgent):
    """
    Stufe 4: Domain-Agent
    
    Fasst mehrere Sub-Agenten zu einem kompletten Fachbereich zusammen.
    Verwaltet domänenspezifische Regeln, Policies und Integrationen.
    
    Beispiele:
    - MailOps-Agent: Alle Mail-Prozesse (Empfangen, Klassifizieren, Antworten, Archivieren)
    - CalendarOps-Agent: Komplette Terminverwaltung (Erstellen, Verschieben, Konflikte)
    - ComplianceOps-Agent: Regelkonformität (DSGVO, Branchenregeln)
    """
    
    def __init__(self,
                 name: str,
                 domain_type: DomainType,
                 description: str = "",
                 policies: Optional[Dict[str, Any]] = None,
                 integrations: Optional[List[str]] = None):
        """
        Initialisiere einen Domain-Agent
        
        Args:
            name: Name des Fachbereichs
            domain_type: Typ des Fachbereichs
            description: Beschreibung
            policies: Domänenspezifische Regeln und Policies
            integrations: Liste von System-Integrationen
        """
        metadata = AgentMetadata(
            name=name,
            description=description or f"Domain-Agent für {domain_type.value}",
            tags=[domain_type.value, "domain"]
        )
        super().__init__(metadata, AgentType.DOMAIN)
        
        self.domain_type = domain_type
        self.sub_agents: Dict[str, SubAgent] = {}
        self.policies = policies or {}
        self.integrations = set(integrations or [])
        self.domain_knowledge = {}
        self.routing_rules: Dict[str, List[str]] = {}
        self.domain_metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'average_response_time': 0.0
        }
        
    def add_sub_agent(self, sub_agent: SubAgent, capabilities: List[str]):
        """
        Füge einen Sub-Agent mit seinen Fähigkeiten hinzu
        
        Args:
            sub_agent: Der Sub-Agent
            capabilities: Liste von Fähigkeiten/Aufgaben die er beherrscht
        """
        self.sub_agents[sub_agent.metadata.name] = sub_agent
        self.context.child_agents.append(sub_agent)
        sub_agent.context.parent_agent = self
        
        # Registriere Routing-Regeln für Fähigkeiten
        for capability in capabilities:
            if capability not in self.routing_rules:
                self.routing_rules[capability] = []
            self.routing_rules[capability].append(sub_agent.metadata.name)
            
    def set_policy(self, policy_name: str, policy_rules: Dict[str, Any]):
        """Setze eine domänenspezifische Policy"""
        self.policies[policy_name] = policy_rules
        
    def add_integration(self, integration_name: str):
        """Füge eine System-Integration hinzu"""
        self.integrations.add(integration_name)
        
    def set_domain_knowledge(self, key: str, knowledge: Any):
        """Setze domänenspezifisches Wissen"""
        self.domain_knowledge[key] = knowledge
        
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Führe domänenspezifische Operationen aus
        """
        start_time = asyncio.get_event_loop().time()
        self.logger.info(f"Domain-Agent {self.metadata.name} verarbeitet Anfrage")
        
        # Metriken
        self.domain_metrics['total_requests'] += 1
        
        # Validierung
        if not self.validate_input(input_data):
            self.domain_metrics['failed_requests'] += 1
            raise ValueError(f"Input-Validierung fehlgeschlagen für {self.metadata.name}")
            
        # Event: Start
        self.trigger_callbacks('domain_request_start', input_data)
        
        # Domain-Kontext erstellen
        domain_context = {
            'domain': self.domain_type.value,
            'policies': self.policies,
            'integrations': list(self.integrations),
            'input': input_data,
            'routing_decisions': [],
            'sub_agent_results': []
        }
        
        try:
            # 1. Klassifiziere Anfrage
            request_type = await self._classify_request(input_data)
            domain_context['request_type'] = request_type
            
            # 2. Wende Policies an
            policy_check = await self._check_policies(request_type, input_data)
            if not policy_check['allowed']:
                raise PermissionError(f"Policy-Verletzung: {policy_check['reason']}")
                
            # 3. Route zu passenden Sub-Agenten
            selected_agents = await self._route_to_sub_agents(request_type, domain_context)
            
            # 4. Führe Sub-Agenten aus
            results = await self._execute_sub_agents(selected_agents, input_data, domain_context)
            
            # 5. Aggregiere Ergebnisse
            final_result = await self._aggregate_results(results, domain_context)
            
            # Erfolgreiches Ergebnis
            output = {
                'success': True,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'domain': self.domain_type.value,
                'request_type': request_type,
                'domain_context': domain_context,
                'result': final_result,
                'sub_agents_used': [agent.metadata.name for agent in selected_agents],
                'execution_time': asyncio.get_event_loop().time() - start_time
            }
            
            # Metriken aktualisieren
            self.domain_metrics['successful_requests'] += 1
            self._update_response_time(output['execution_time'])
            
            # Historie
            self.context.add_to_history(f"domain_{self.metadata.name}", output)
            
            # Event: Ende
            self.trigger_callbacks('domain_request_complete', output)
            
            self.logger.info(f"Domain-Agent {self.metadata.name} erfolgreich abgeschlossen")
            return output
            
        except Exception as e:
            self.domain_metrics['failed_requests'] += 1
            
            error_output = {
                'success': False,
                'agent_id': self.metadata.id,
                'agent_name': self.metadata.name,
                'domain': self.domain_type.value,
                'error': str(e),
                'error_type': type(e).__name__,
                'domain_context': domain_context
            }
            
            # Event: Fehler
            self.trigger_callbacks('domain_request_error', error_output)
            
            self.logger.error(f"Domain-Fehler in {self.metadata.name}: {e}")
            return error_output
            
    async def _classify_request(self, input_data: Dict[str, Any]) -> str:
        """Klassifiziere die Anfrage nach Typ"""
        # Einfache Klassifizierung basierend auf Keywords
        # In Produktion würde hier ein ML-Modell verwendet
        
        request_text = str(input_data.get('text', '')).lower()
        
        # Domain-spezifische Klassifizierung
        if self.domain_type == DomainType.MAIL_OPS:
            if 'reply' in request_text or 'antwort' in request_text:
                return 'mail_reply'
            elif 'forward' in request_text or 'weiterleiten' in request_text:
                return 'mail_forward'
            elif 'archive' in request_text or 'archivieren' in request_text:
                return 'mail_archive'
            else:
                return 'mail_process'
                
        elif self.domain_type == DomainType.CALENDAR_OPS:
            if 'book' in request_text or 'buchen' in request_text:
                return 'calendar_book'
            elif 'cancel' in request_text or 'stornieren' in request_text:
                return 'calendar_cancel'
            elif 'reschedule' in request_text or 'verschieben' in request_text:
                return 'calendar_reschedule'
            else:
                return 'calendar_query'
                
        # Fallback
        return 'generic_request'
        
    async def _check_policies(self, request_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prüfe domänenspezifische Policies"""
        # Prüfe globale Policies
        if 'global' in self.policies:
            for rule_name, rule in self.policies['global'].items():
                if not await self._evaluate_policy_rule(rule, input_data):
                    return {'allowed': False, 'reason': f"Globale Policy '{rule_name}' verletzt"}
                    
        # Prüfe request-spezifische Policies
        if request_type in self.policies:
            for rule_name, rule in self.policies[request_type].items():
                if not await self._evaluate_policy_rule(rule, input_data):
                    return {'allowed': False, 'reason': f"Policy '{rule_name}' für {request_type} verletzt"}
                    
        return {'allowed': True, 'reason': None}
        
    async def _evaluate_policy_rule(self, rule: Dict[str, Any], input_data: Dict[str, Any]) -> bool:
        """Evaluiere eine einzelne Policy-Regel"""
        # Vereinfachte Policy-Evaluierung
        # In Produktion würde hier eine Policy-Engine verwendet
        
        if 'required_fields' in rule:
            for field in rule['required_fields']:
                if field not in input_data:
                    return False
                    
        if 'forbidden_values' in rule:
            for field, forbidden in rule['forbidden_values'].items():
                if field in input_data and input_data[field] in forbidden:
                    return False
                    
        if 'max_value' in rule:
            for field, max_val in rule['max_value'].items():
                if field in input_data and input_data[field] > max_val:
                    return False
                    
        return True
        
    async def _route_to_sub_agents(self, request_type: str, context: Dict[str, Any]) -> List[SubAgent]:
        """Route Anfrage zu passenden Sub-Agenten"""
        selected_agents = []
        
        # Finde passende Sub-Agenten basierend auf Request-Typ
        if request_type in self.routing_rules:
            for agent_name in self.routing_rules[request_type]:
                if agent_name in self.sub_agents:
                    selected_agents.append(self.sub_agents[agent_name])
                    context['routing_decisions'].append({
                        'request_type': request_type,
                        'selected_agent': agent_name,
                        'reason': 'capability_match'
                    })
                    
        # Fallback: Verwende ersten verfügbaren Sub-Agent
        if not selected_agents and self.sub_agents:
            first_agent = list(self.sub_agents.values())[0]
            selected_agents.append(first_agent)
            context['routing_decisions'].append({
                'request_type': request_type,
                'selected_agent': first_agent.metadata.name,
                'reason': 'fallback'
            })
            
        return selected_agents
        
    async def _execute_sub_agents(self, agents: List[SubAgent], 
                                input_data: Dict[str, Any], 
                                context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Führe ausgewählte Sub-Agenten aus"""
        results = []
        
        # Sequentielle Ausführung (könnte auch parallel sein)
        for agent in agents:
            try:
                # Erweitere Input mit Domain-Kontext
                agent_input = input_data.copy()
                agent_input['domain_context'] = {
                    'domain': self.domain_type.value,
                    'policies': self.policies,
                    'integrations': list(self.integrations)
                }
                
                result = await agent.execute(agent_input)
                results.append(result)
                context['sub_agent_results'].append({
                    'agent': agent.metadata.name,
                    'success': result.get('success', False),
                    'summary': result.get('final_result', {})
                })
                
            except Exception as e:
                self.logger.error(f"Sub-Agent {agent.metadata.name} fehlgeschlagen: {e}")
                results.append({
                    'success': False,
                    'agent_name': agent.metadata.name,
                    'error': str(e)
                })
                
        return results
        
    async def _aggregate_results(self, results: List[Dict[str, Any]], 
                               context: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregiere Ergebnisse der Sub-Agenten"""
        # Sammle erfolgreiche Ergebnisse
        successful_results = [r for r in results if r.get('success', False)]
        
        if not successful_results:
            return {
                'status': 'failed',
                'message': 'Keine erfolgreichen Sub-Agent Ausführungen',
                'errors': [r.get('error') for r in results if not r.get('success')]
            }
            
        # Aggregiere basierend auf Domain-Typ
        if self.domain_type == DomainType.MAIL_OPS:
            return self._aggregate_mail_results(successful_results)
        elif self.domain_type == DomainType.CALENDAR_OPS:
            return self._aggregate_calendar_results(successful_results)
        else:
            # Generische Aggregation
            return {
                'status': 'success',
                'aggregated_count': len(successful_results),
                'results': [r.get('final_result') for r in successful_results]
            }
            
    def _aggregate_mail_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Spezifische Aggregation für Mail-Operationen"""
        return {
            'status': 'success',
            'mails_processed': len(results),
            'actions_taken': [r.get('final_result', {}).get('action') for r in results]
        }
        
    def _aggregate_calendar_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Spezifische Aggregation für Kalender-Operationen"""
        return {
            'status': 'success',
            'appointments_affected': len(results),
            'changes': [r.get('final_result', {}).get('change_type') for r in results]
        }
        
    def _update_response_time(self, execution_time: float):
        """Aktualisiere durchschnittliche Antwortzeit"""
        current_avg = self.domain_metrics['average_response_time']
        total_count = self.domain_metrics['successful_requests']
        
        # Berechne neuen Durchschnitt
        new_avg = ((current_avg * (total_count - 1)) + execution_time) / total_count
        self.domain_metrics['average_response_time'] = new_avg
        
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validiere Input für die Domain"""
        # Basis-Validierung
        if not isinstance(input_data, dict):
            return False
            
        # Domain-spezifische Validierung
        if self.domain_type == DomainType.MAIL_OPS:
            # Mail-Operationen brauchen bestimmte Felder
            return any(field in input_data for field in ['email', 'message', 'mail_id', 'text'])
        elif self.domain_type == DomainType.CALENDAR_OPS:
            # Kalender-Operationen brauchen Zeit-bezogene Felder
            return any(field in input_data for field in ['date', 'time', 'appointment', 'calendar_id'])
            
        # Generische Domains akzeptieren alles
        return True
        
    def get_domain_info(self) -> Dict[str, Any]:
        """Gibt Informationen über die Domain zurück"""
        return {
            'name': self.metadata.name,
            'type': self.domain_type.value,
            'description': self.metadata.description,
            'sub_agents': list(self.sub_agents.keys()),
            'capabilities': list(self.routing_rules.keys()),
            'policies': list(self.policies.keys()),
            'integrations': list(self.integrations),
            'metrics': self.domain_metrics
        }