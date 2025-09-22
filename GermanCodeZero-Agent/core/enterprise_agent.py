"""
Enterprise-Agent: Komplette Unternehmenslösung
"""

from typing import Any, Dict, List, Optional, Set
import asyncio
from datetime import datetime
from enum import Enum
from .base_agent import BaseAgent, AgentType, AgentMetadata
from .domain_agent import DomainAgent, DomainType

class Industry(Enum):
    """Branchen für Enterprise-Agenten"""
    HEALTHCARE = "healthcare"          # Praxis, Krankenhaus
    LEGAL = "legal"                    # Kanzlei, Rechtsberatung
    ECOMMERCE = "ecommerce"           # Online-Handel
    FINANCE = "finance"               # Bank, Versicherung
    MANUFACTURING = "manufacturing"    # Produktion
    EDUCATION = "education"           # Schule, Universität
    HOSPITALITY = "hospitality"       # Hotel, Restaurant
    CUSTOM = "custom"                 # Individuell

class EnterpriseAgent(BaseAgent):
    """
    Stufe 5: Enterprise-Agent
    
    Die höchste Ebene - eine komplette Unternehmenslösung.
    Steuert mehrere Domain-Agenten, implementiert Geschäftsregeln,
    Monitoring, Compliance und bietet eine einheitliche Schnittstelle.
    
    Beispiele:
    - Praxis-Mail-Agent: Komplette E-Mail-Verwaltung für Arztpraxen
    - E-Commerce-Agent: Bestellungen, Retouren, Kundenservice
    - Kanzlei-Agent: Fristen, Dokumente, Mandantenkommunikation
    """
    
    def __init__(self,
                 name: str,
                 industry: Industry,
                 company_name: str,
                 description: str = "",
                 global_policies: Optional[Dict[str, Any]] = None,
                 compliance_requirements: Optional[List[str]] = None):
        """
        Initialisiere einen Enterprise-Agent
        
        Args:
            name: Name der Lösung
            industry: Branche
            company_name: Name des Unternehmens
            description: Beschreibung
            global_policies: Unternehmensweite Regeln
            compliance_requirements: Compliance-Anforderungen (DSGVO, HIPAA, etc.)
        """
        metadata = AgentMetadata(
            name=name,
            description=description or f"Enterprise-Agent für {company_name} ({industry.value})",
            tags=[industry.value, "enterprise", company_name]
        )
        super().__init__(metadata, AgentType.ENTERPRISE)
        
        self.industry = industry
        self.company_name = company_name
        self.domain_agents: Dict[str, DomainAgent] = {}
        self.global_policies = global_policies or {}
        self.compliance_requirements = set(compliance_requirements or [])
        
        # Enterprise-spezifische Komponenten
        self.orchestration_rules = {}
        self.business_processes = {}
        self.integration_layer = {
            'apis': {},
            'databases': {},
            'external_services': {}
        }
        
        # Monitoring & Analytics
        self.monitoring = {
            'start_time': datetime.now(),
            'total_requests': 0,
            'domain_usage': {},
            'error_log': [],
            'performance_metrics': {},
            'compliance_violations': []
        }
        
        # Audit Trail
        self.audit_trail = []
        
        # User Management
        self.user_roles = {
            'admin': {'permissions': ['*']},
            'operator': {'permissions': ['execute', 'view']},
            'viewer': {'permissions': ['view']}
        }
        
    def add_domain_agent(self, domain_agent: DomainAgent):
        """Füge einen Domain-Agent hinzu"""
        self.domain_agents[domain_agent.metadata.name] = domain_agent
        self.context.child_agents.append(domain_agent)
        domain_agent.context.parent_agent = self
        
        # Initialisiere Monitoring für diese Domain
        self.monitoring['domain_usage'][domain_agent.metadata.name] = {
            'requests': 0,
            'success_rate': 0.0,
            'avg_response_time': 0.0
        }
        
    def define_business_process(self, process_name: str, 
                              process_flow: List[Dict[str, Any]]):
        """
        Definiere einen Geschäftsprozess
        
        Args:
            process_name: Name des Prozesses
            process_flow: Liste von Schritten mit Domain-Agents und Bedingungen
        """
        self.business_processes[process_name] = {
            'name': process_name,
            'flow': process_flow,
            'created_at': datetime.now(),
            'execution_count': 0
        }
        
    def set_orchestration_rule(self, rule_name: str, rule_definition: Dict[str, Any]):
        """Setze eine Orchestrierungs-Regel"""
        self.orchestration_rules[rule_name] = rule_definition
        
    def add_integration(self, integration_type: str, name: str, config: Dict[str, Any]):
        """Füge eine externe Integration hinzu"""
        if integration_type in self.integration_layer:
            self.integration_layer[integration_type][name] = config
            
    def add_compliance_requirement(self, requirement: str):
        """Füge eine Compliance-Anforderung hinzu"""
        self.compliance_requirements.add(requirement)
        
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Führe Enterprise-Operation aus
        """
        start_time = asyncio.get_event_loop().time()
        request_id = f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}-{self.monitoring['total_requests']}"
        
        self.logger.info(f"Enterprise-Agent {self.metadata.name} verarbeitet Request {request_id}")
        
        # Monitoring
        self.monitoring['total_requests'] += 1
        
        # Audit Trail Start
        audit_entry = {
            'request_id': request_id,
            'timestamp': datetime.now(),
            'user': input_data.get('user', 'system'),
            'input': input_data,
            'actions': []
        }
        
        # Validierung
        if not self.validate_input(input_data):
            error_msg = f"Input-Validierung fehlgeschlagen für {self.metadata.name}"
            self._log_error(error_msg, request_id)
            return self._create_error_response(error_msg, request_id)
            
        # Event: Start
        self.trigger_callbacks('enterprise_request_start', {
            'request_id': request_id,
            'input': input_data
        })
        
        # Enterprise-Kontext
        enterprise_context = {
            'request_id': request_id,
            'industry': self.industry.value,
            'company': self.company_name,
            'compliance': list(self.compliance_requirements),
            'user': input_data.get('user', 'system'),
            'input': input_data,
            'workflow': [],
            'domain_results': {}
        }
        
        try:
            # 1. Authentifizierung & Autorisierung
            auth_result = await self._authenticate_and_authorize(input_data, enterprise_context)
            if not auth_result['authorized']:
                raise PermissionError(f"Nicht autorisiert: {auth_result['reason']}")
                
            # 2. Compliance-Prüfung
            compliance_result = await self._check_compliance(input_data, enterprise_context)
            if not compliance_result['compliant']:
                self._log_compliance_violation(compliance_result, request_id)
                raise ValueError(f"Compliance-Verletzung: {compliance_result['violations']}")
                
            # 3. Business-Prozess identifizieren
            process_name = await self._identify_business_process(input_data)
            enterprise_context['business_process'] = process_name
            
            # 4. Prozess ausführen oder Standard-Orchestrierung
            if process_name and process_name in self.business_processes:
                result = await self._execute_business_process(process_name, input_data, enterprise_context)
            else:
                result = await self._execute_standard_orchestration(input_data, enterprise_context)
                
            # 5. Post-Processing
            final_result = await self._post_process_result(result, enterprise_context)
            
            # Erfolgreiches Ergebnis
            execution_time = asyncio.get_event_loop().time() - start_time
            output = {
                'success': True,
                'request_id': request_id,
                'enterprise': self.metadata.name,
                'company': self.company_name,
                'industry': self.industry.value,
                'business_process': process_name,
                'result': final_result,
                'context': enterprise_context,
                'execution_time': execution_time,
                'timestamp': datetime.now().isoformat()
            }
            
            # Audit Trail Update
            audit_entry['output'] = output
            audit_entry['status'] = 'success'
            self.audit_trail.append(audit_entry)
            
            # Historie
            self.context.add_to_history(f"enterprise_{request_id}", output)
            
            # Event: Ende
            self.trigger_callbacks('enterprise_request_complete', output)
            
            self.logger.info(f"Enterprise-Request {request_id} erfolgreich in {execution_time:.2f}s")
            return output
            
        except Exception as e:
            error_msg = str(e)
            self._log_error(error_msg, request_id)
            
            # Audit Trail Update
            audit_entry['error'] = error_msg
            audit_entry['status'] = 'failed'
            self.audit_trail.append(audit_entry)
            
            # Event: Fehler
            self.trigger_callbacks('enterprise_request_error', {
                'request_id': request_id,
                'error': e
            })
            
            return self._create_error_response(error_msg, request_id, enterprise_context)
            
    async def _authenticate_and_authorize(self, input_data: Dict[str, Any], 
                                        context: Dict[str, Any]) -> Dict[str, Any]:
        """Authentifiziere und autorisiere den Request"""
        user = input_data.get('user', 'anonymous')
        role = input_data.get('role', 'viewer')
        action = input_data.get('action', 'execute')
        
        # Prüfe ob Rolle existiert
        if role not in self.user_roles:
            return {'authorized': False, 'reason': f'Unbekannte Rolle: {role}'}
            
        # Prüfe Berechtigungen
        permissions = self.user_roles[role]['permissions']
        if '*' in permissions or action in permissions:
            context['workflow'].append({
                'step': 'authentication',
                'result': 'authorized',
                'user': user,
                'role': role
            })
            return {'authorized': True, 'user': user, 'role': role}
            
        return {'authorized': False, 'reason': f'Keine Berechtigung für Aktion: {action}'}
        
    async def _check_compliance(self, input_data: Dict[str, Any], 
                              context: Dict[str, Any]) -> Dict[str, Any]:
        """Prüfe Compliance-Anforderungen"""
        violations = []
        
        # DSGVO-Prüfung
        if 'DSGVO' in self.compliance_requirements:
            if 'personal_data' in input_data and not input_data.get('consent'):
                violations.append('DSGVO: Keine Einwilligung für personenbezogene Daten')
                
        # HIPAA-Prüfung (Gesundheitsdaten USA)
        if 'HIPAA' in self.compliance_requirements:
            if 'health_data' in input_data and not input_data.get('hipaa_compliant'):
                violations.append('HIPAA: Gesundheitsdaten nicht konform')
                
        # Branchen-spezifische Prüfungen
        if self.industry == Industry.HEALTHCARE:
            # Rezeptpflicht-Prüfung
            if input_data.get('prescription_required') and not input_data.get('doctor_approval'):
                violations.append('Rezeptpflichtige Medikamente benötigen Arzt-Freigabe')
                
        elif self.industry == Industry.FINANCE:
            # Geldwäsche-Prüfung
            if input_data.get('amount', 0) > 10000 and not input_data.get('aml_check'):
                violations.append('AML: Geldwäsche-Prüfung erforderlich für Beträge > 10.000')
                
        context['workflow'].append({
            'step': 'compliance_check',
            'violations': violations,
            'compliant': len(violations) == 0
        })
        
        return {
            'compliant': len(violations) == 0,
            'violations': violations
        }
        
    async def _identify_business_process(self, input_data: Dict[str, Any]) -> Optional[str]:
        """Identifiziere den passenden Geschäftsprozess"""
        # Einfache Prozess-Identifikation basierend auf Input
        process_type = input_data.get('process_type')
        if process_type and process_type in self.business_processes:
            return process_type
            
        # Branchen-spezifische Prozess-Erkennung
        if self.industry == Industry.HEALTHCARE:
            if 'appointment' in str(input_data).lower():
                return 'appointment_booking'
            elif 'prescription' in str(input_data).lower():
                return 'prescription_handling'
                
        elif self.industry == Industry.ECOMMERCE:
            if 'order' in str(input_data).lower():
                return 'order_processing'
            elif 'return' in str(input_data).lower():
                return 'return_handling'
                
        return None
        
    async def _execute_business_process(self, process_name: str,
                                      input_data: Dict[str, Any],
                                      context: Dict[str, Any]) -> Dict[str, Any]:
        """Führe einen definierten Geschäftsprozess aus"""
        process = self.business_processes[process_name]
        process['execution_count'] += 1
        
        results = []
        current_data = input_data.copy()
        
        for step in process['flow']:
            domain_name = step.get('domain')
            action = step.get('action')
            conditions = step.get('conditions', {})
            
            # Prüfe Bedingungen
            if conditions:
                if not await self._evaluate_conditions(conditions, current_data):
                    continue
                    
            # Finde Domain-Agent
            if domain_name not in self.domain_agents:
                raise ValueError(f"Domain-Agent '{domain_name}' nicht gefunden")
                
            domain_agent = self.domain_agents[domain_name]
            
            # Führe aus
            domain_input = current_data.copy()
            domain_input['action'] = action
            
            result = await domain_agent.execute(domain_input)
            results.append(result)
            context['domain_results'][domain_name] = result
            
            # Update Monitoring
            self._update_domain_monitoring(domain_name, result)
            
            # Verwende Output für nächsten Schritt
            if result.get('success'):
                current_data.update(result.get('result', {}))
                
        return {
            'process': process_name,
            'steps_executed': len(results),
            'results': results,
            'final_state': current_data
        }
        
    async def _execute_standard_orchestration(self, input_data: Dict[str, Any],
                                            context: Dict[str, Any]) -> Dict[str, Any]:
        """Standard-Orchestrierung wenn kein spezifischer Prozess definiert ist"""
        # Intelligentes Routing basierend auf Input
        relevant_domains = await self._identify_relevant_domains(input_data)
        
        results = {}
        for domain_name in relevant_domains:
            if domain_name in self.domain_agents:
                domain_agent = self.domain_agents[domain_name]
                
                try:
                    result = await domain_agent.execute(input_data)
                    results[domain_name] = result
                    context['domain_results'][domain_name] = result
                    
                    # Update Monitoring
                    self._update_domain_monitoring(domain_name, result)
                    
                except Exception as e:
                    self.logger.error(f"Domain {domain_name} fehlgeschlagen: {e}")
                    results[domain_name] = {
                        'success': False,
                        'error': str(e)
                    }
                    
        return {
            'orchestration': 'standard',
            'domains_invoked': list(results.keys()),
            'results': results
        }
        
    async def _identify_relevant_domains(self, input_data: Dict[str, Any]) -> List[str]:
        """Identifiziere relevante Domains für den Request"""
        relevant = []
        
        # Analysiere Input um relevante Domains zu finden
        input_str = str(input_data).lower()
        
        for domain_name, domain_agent in self.domain_agents.items():
            # Prüfe ob Domain-Keywords im Input sind
            if domain_agent.domain_type == DomainType.MAIL_OPS:
                if any(keyword in input_str for keyword in ['mail', 'email', 'message']):
                    relevant.append(domain_name)
                    
            elif domain_agent.domain_type == DomainType.CALENDAR_OPS:
                if any(keyword in input_str for keyword in ['calendar', 'appointment', 'termin']):
                    relevant.append(domain_name)
                    
            # Weitere Domain-Typen...
            
        return relevant
        
    async def _post_process_result(self, result: Dict[str, Any],
                                 context: Dict[str, Any]) -> Dict[str, Any]:
        """Post-Processing der Ergebnisse"""
        # Formatiere Ergebnis für Client
        processed = {
            'summary': self._generate_summary(result),
            'actions_taken': self._extract_actions(result),
            'next_steps': self._suggest_next_steps(result, context),
            'data': result
        }
        
        # Füge Notifications hinzu wenn nötig
        if self._requires_notification(result):
            processed['notifications'] = self._generate_notifications(result)
            
        return processed
        
    async def _evaluate_conditions(self, conditions: Dict[str, Any],
                                 data: Dict[str, Any]) -> bool:
        """Evaluiere Bedingungen für Prozess-Schritte"""
        for field, expected in conditions.items():
            if field not in data:
                return False
            if data[field] != expected:
                return False
        return True
        
    def _update_domain_monitoring(self, domain_name: str, result: Dict[str, Any]):
        """Aktualisiere Domain-Monitoring Metriken"""
        if domain_name in self.monitoring['domain_usage']:
            metrics = self.monitoring['domain_usage'][domain_name]
            metrics['requests'] += 1
            
            if result.get('success'):
                # Update Success Rate
                success_rate = metrics.get('success_rate', 0.0)
                new_rate = ((success_rate * (metrics['requests'] - 1)) + 1) / metrics['requests']
                metrics['success_rate'] = new_rate
                
                # Update Response Time
                if 'execution_time' in result:
                    avg_time = metrics.get('avg_response_time', 0.0)
                    new_avg = ((avg_time * (metrics['requests'] - 1)) + result['execution_time']) / metrics['requests']
                    metrics['avg_response_time'] = new_avg
                    
    def _generate_summary(self, result: Dict[str, Any]) -> str:
        """Generiere eine Zusammenfassung des Ergebnisses"""
        if 'process' in result:
            return f"Geschäftsprozess '{result['process']}' mit {result['steps_executed']} Schritten ausgeführt"
        elif 'orchestration' in result:
            return f"Standard-Orchestrierung über {len(result['domains_invoked'])} Domains ausgeführt"
        return "Operation abgeschlossen"
        
    def _extract_actions(self, result: Dict[str, Any]) -> List[str]:
        """Extrahiere alle durchgeführten Aktionen"""
        actions = []
        
        if 'results' in result:
            if isinstance(result['results'], list):
                for r in result['results']:
                    if isinstance(r, dict) and 'action' in r:
                        actions.append(r['action'])
            elif isinstance(result['results'], dict):
                for domain, domain_result in result['results'].items():
                    if isinstance(domain_result, dict) and 'result' in domain_result:
                        actions.append(f"{domain}: {domain_result.get('request_type', 'processed')}")
                        
        return actions
        
    def _suggest_next_steps(self, result: Dict[str, Any], context: Dict[str, Any]) -> List[str]:
        """Schlage nächste Schritte vor"""
        suggestions = []
        
        # Branchen-spezifische Vorschläge
        if self.industry == Industry.HEALTHCARE:
            if 'appointment' in str(result):
                suggestions.append("Termin-Erinnerung 24h vorher senden")
            if 'prescription' in str(result):
                suggestions.append("Rezept-Status nach 7 Tagen prüfen")
                
        elif self.industry == Industry.ECOMMERCE:
            if 'order' in str(result):
                suggestions.append("Versand-Tracking aktivieren")
                suggestions.append("Review-Anfrage nach Lieferung senden")
                
        return suggestions
        
    def _requires_notification(self, result: Dict[str, Any]) -> bool:
        """Prüfe ob Benachrichtigungen nötig sind"""
        # Benachrichtige bei wichtigen Events
        if 'compliance_violation' in str(result):
            return True
        if 'error' in result and result.get('error'):
            return True
        if 'urgent' in str(result).lower():
            return True
        return False
        
    def _generate_notifications(self, result: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generiere Benachrichtigungen"""
        notifications = []
        
        if 'error' in result:
            notifications.append({
                'type': 'error',
                'recipient': 'admin',
                'message': f"Fehler in Enterprise-Agent: {result['error']}"
            })
            
        return notifications
        
    def _log_error(self, error_msg: str, request_id: str):
        """Logge Fehler für Monitoring"""
        self.monitoring['error_log'].append({
            'timestamp': datetime.now(),
            'request_id': request_id,
            'error': error_msg
        })
        
    def _log_compliance_violation(self, compliance_result: Dict[str, Any], request_id: str):
        """Logge Compliance-Verletzungen"""
        self.monitoring['compliance_violations'].append({
            'timestamp': datetime.now(),
            'request_id': request_id,
            'violations': compliance_result['violations']
        })
        
    def _create_error_response(self, error_msg: str, request_id: str,
                             context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Erstelle standardisierte Fehlerantwort"""
        return {
            'success': False,
            'request_id': request_id,
            'enterprise': self.metadata.name,
            'error': error_msg,
            'timestamp': datetime.now().isoformat(),
            'context': context or {},
            'support_message': f"Bei Problemen wenden Sie sich an den Support mit Request-ID: {request_id}"
        }
        
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validiere Input für Enterprise-Operation"""
        # Basis-Validierung
        if not isinstance(input_data, dict):
            return False
            
        # Erforderliche Felder für Enterprise
        required_fields = self.global_policies.get('required_fields', [])
        for field in required_fields:
            if field not in input_data:
                self.logger.error(f"Erforderliches Feld '{field}' fehlt")
                return False
                
        return True
        
    def get_enterprise_info(self) -> Dict[str, Any]:
        """Gibt umfassende Informationen über den Enterprise-Agent zurück"""
        return {
            'name': self.metadata.name,
            'company': self.company_name,
            'industry': self.industry.value,
            'description': self.metadata.description,
            'domains': list(self.domain_agents.keys()),
            'business_processes': list(self.business_processes.keys()),
            'compliance': list(self.compliance_requirements),
            'integrations': {
                k: list(v.keys()) for k, v in self.integration_layer.items()
            },
            'monitoring': {
                'uptime': str(datetime.now() - self.monitoring['start_time']),
                'total_requests': self.monitoring['total_requests'],
                'domain_usage': self.monitoring['domain_usage'],
                'error_count': len(self.monitoring['error_log']),
                'compliance_violations': len(self.monitoring['compliance_violations'])
            },
            'roles': list(self.user_roles.keys())
        }
        
    async def generate_report(self, report_type: str = 'summary',
                            time_range: Optional[Dict[str, datetime]] = None) -> Dict[str, Any]:
        """Generiere Berichte über den Enterprise-Agent"""
        if report_type == 'summary':
            return self.get_enterprise_info()
        elif report_type == 'audit':
            # Filtere Audit Trail nach Zeitraum
            if time_range:
                filtered_audit = [
                    entry for entry in self.audit_trail
                    if time_range.get('start', datetime.min) <= entry['timestamp'] <= time_range.get('end', datetime.max)
                ]
            else:
                filtered_audit = self.audit_trail
                
            return {
                'report_type': 'audit',
                'entries': len(filtered_audit),
                'time_range': time_range,
                'audit_trail': filtered_audit
            }
        elif report_type == 'performance':
            return {
                'report_type': 'performance',
                'monitoring': self.monitoring,
                'recommendations': self._generate_performance_recommendations()
            }
            
        return {'error': f'Unbekannter Report-Typ: {report_type}'}
        
    def _generate_performance_recommendations(self) -> List[str]:
        """Generiere Performance-Empfehlungen basierend auf Monitoring"""
        recommendations = []
        
        # Analysiere Domain-Usage
        for domain, metrics in self.monitoring['domain_usage'].items():
            if metrics['success_rate'] < 0.9:
                recommendations.append(f"Domain '{domain}' hat niedrige Erfolgsrate ({metrics['success_rate']:.1%})")
            if metrics['avg_response_time'] > 5.0:
                recommendations.append(f"Domain '{domain}' hat hohe Antwortzeit ({metrics['avg_response_time']:.1f}s)")
                
        # Fehleranalyse
        if len(self.monitoring['error_log']) > self.monitoring['total_requests'] * 0.1:
            recommendations.append("Hohe Fehlerrate erkannt - Log-Analyse empfohlen")
            
        return recommendations