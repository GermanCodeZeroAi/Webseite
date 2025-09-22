"""
Beispiel Enterprise-Agenten - Stufe 5
Komplette Unternehmenslösungen mit mehreren Domain-Agenten
"""

import asyncio
from typing import Dict, Any, List
from datetime import datetime

# Add parent directory to path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.enterprise_agent import EnterpriseAgent, Industry
from core.domain_agent import DomainAgent, DomainType
# Import domain examples to reuse
from domain_examples import create_mailops_domain, create_calendarops_domain


# ============= BEISPIEL: Praxis Enterprise-Agent =============
def create_praxis_enterprise_agent() -> EnterpriseAgent:
    """
    Erstelle einen kompletten Enterprise-Agent für eine Arztpraxis
    Integriert alle Domains für eine vollständige Praxisverwaltung
    """
    
    # === Domain 1: MailOps (aus domain_examples) ===
    mailops_domain = create_mailops_domain()
    
    # === Domain 2: CalendarOps (aus domain_examples) ===
    calendarops_domain = create_calendarops_domain()
    
    # === Domain 3: PatientOps ===
    def create_patientops_domain() -> DomainAgent:
        domain = DomainAgent(
            name="patientops_center",
            domain_type=DomainType.CUSTOM,
            description="Patientenverwaltung und -betreuung",
            policies={
                'data_protection': {
                    'encryption_required': True,
                    'access_logging': True,
                    'retention_years': 10
                },
                'consent': {
                    'required_for_data_sharing': True,
                    'opt_in_marketing': False,
                    'revocable': True
                }
            },
            integrations=['patient_db', 'insurance_api', 'lab_systems']
        )
        
        # Vereinfachte Sub-Agenten für Demo
        from core.sub_agent import SubAgent
        
        patient_record_manager = SubAgent(
            name="patient_record_manager",
            description="Verwalte Patientenakten"
        )
        
        domain.add_sub_agent(patient_record_manager, [
            'create_patient',
            'update_records',
            'medical_history',
            'lab_results'
        ])
        
        return domain
    
    # === Domain 4: BillingOps ===
    def create_billingops_domain() -> DomainAgent:
        domain = DomainAgent(
            name="billingops_center",
            domain_type=DomainType.CUSTOM,
            description="Abrechnung und Finanzverwaltung",
            policies={
                'billing_rules': {
                    'currency': 'EUR',
                    'tax_rate': 0.19,
                    'payment_terms_days': 30
                },
                'insurance': {
                    'primary_submission': 'automatic',
                    'secondary_billing': 'manual_review'
                }
            },
            integrations=['accounting_software', 'insurance_clearing', 'payment_gateway']
        )
        
        from core.sub_agent import SubAgent
        
        invoice_processor = SubAgent(
            name="invoice_processor",
            description="Verarbeite Rechnungen und Zahlungen"
        )
        
        domain.add_sub_agent(invoice_processor, [
            'create_invoice',
            'process_payment',
            'insurance_claim',
            'payment_reminder'
        ])
        
        return domain
    
    # === Domain 5: ComplianceOps ===
    def create_complianceops_domain() -> DomainAgent:
        domain = DomainAgent(
            name="complianceops_center",
            domain_type=DomainType.COMPLIANCE_OPS,
            description="Compliance und Qualitätssicherung",
            policies={
                'regulations': {
                    'dsgvo': True,
                    'medical_device_regulation': True,
                    'quality_management': 'ISO_9001'
                },
                'audit': {
                    'frequency': 'quarterly',
                    'external_audit': 'yearly',
                    'documentation_required': True
                }
            },
            integrations=['audit_system', 'document_management', 'training_platform']
        )
        
        from core.sub_agent import SubAgent
        
        compliance_monitor = SubAgent(
            name="compliance_monitor",
            description="Überwache Compliance-Anforderungen"
        )
        
        domain.add_sub_agent(compliance_monitor, [
            'dsgvo_check',
            'audit_trail',
            'risk_assessment',
            'incident_reporting'
        ])
        
        return domain
    
    # === Erstelle Enterprise-Agent ===
    enterprise = EnterpriseAgent(
        name="praxis_management_system",
        industry=Industry.HEALTHCARE,
        company_name="Beispiel-Praxis Dr. Schmidt",
        description="Vollständiges KI-gestütztes Praxisverwaltungssystem",
        global_policies={
            'required_fields': ['patient_id', 'user_authentication'],
            'working_hours': {
                'monday_friday': '08:00-18:00',
                'saturday': '09:00-13:00',
                'sunday': 'closed'
            },
            'emergency_handling': {
                'always_available': True,
                'escalation_phone': '+49-123-456789'
            },
            'data_security': {
                'encryption': 'AES-256',
                'backup_frequency': 'daily',
                'backup_retention_days': 90
            }
        },
        compliance_requirements=[
            'DSGVO',
            'BDSG_neu',
            'SGB_V',
            'GOÄ',
            'EU-MDR',
            'QM-RL'
        ]
    )
    
    # Füge alle Domain-Agenten hinzu
    enterprise.add_domain_agent(mailops_domain)
    enterprise.add_domain_agent(calendarops_domain)
    enterprise.add_domain_agent(create_patientops_domain())
    enterprise.add_domain_agent(create_billingops_domain())
    enterprise.add_domain_agent(create_complianceops_domain())
    
    # === Definiere Geschäftsprozesse ===
    
    # Prozess 1: Neue Patientenaufnahme
    enterprise.define_business_process(
        'new_patient_onboarding',
        [
            {
                'domain': 'mailops_center',
                'action': 'process_registration_email',
                'description': 'Empfange und verarbeite Registrierungs-E-Mail'
            },
            {
                'domain': 'patientops_center',
                'action': 'create_patient_record',
                'conditions': {'valid_insurance': True},
                'description': 'Erstelle Patientenakte'
            },
            {
                'domain': 'complianceops_center',
                'action': 'verify_consent',
                'description': 'Prüfe Datenschutz-Einwilligung'
            },
            {
                'domain': 'calendarops_center',
                'action': 'schedule_first_appointment',
                'description': 'Plane Ersttermin'
            },
            {
                'domain': 'mailops_center',
                'action': 'send_welcome_package',
                'description': 'Sende Willkommenspaket'
            }
        ]
    )
    
    # Prozess 2: Termin-Lifecycle
    enterprise.define_business_process(
        'appointment_lifecycle',
        [
            {
                'domain': 'mailops_center',
                'action': 'receive_appointment_request'
            },
            {
                'domain': 'calendarops_center',
                'action': 'check_availability'
            },
            {
                'domain': 'patientops_center',
                'action': 'verify_patient_data'
            },
            {
                'domain': 'calendarops_center',
                'action': 'book_appointment',
                'conditions': {'slot_available': True}
            },
            {
                'domain': 'mailops_center',
                'action': 'send_confirmation'
            },
            {
                'domain': 'billingops_center',
                'action': 'prepare_billing_preview'
            }
        ]
    )
    
    # Prozess 3: Behandlung und Abrechnung
    enterprise.define_business_process(
        'treatment_billing_cycle',
        [
            {
                'domain': 'patientops_center',
                'action': 'update_treatment_record'
            },
            {
                'domain': 'billingops_center',
                'action': 'create_invoice'
            },
            {
                'domain': 'complianceops_center',
                'action': 'validate_billing_codes'
            },
            {
                'domain': 'billingops_center',
                'action': 'submit_to_insurance'
            },
            {
                'domain': 'mailops_center',
                'action': 'send_invoice_to_patient'
            }
        ]
    )
    
    # Prozess 4: Notfall-Behandlung
    enterprise.define_business_process(
        'emergency_handling',
        [
            {
                'domain': 'mailops_center',
                'action': 'detect_emergency',
                'conditions': {'is_emergency': True}
            },
            {
                'domain': 'calendarops_center',
                'action': 'create_emergency_slot'
            },
            {
                'domain': 'patientops_center',
                'action': 'prepare_emergency_record'
            },
            {
                'domain': 'complianceops_center',
                'action': 'log_emergency_access'
            }
        ]
    )
    
    # === Setze Orchestrierungs-Regeln ===
    enterprise.set_orchestration_rule('priority_routing', {
        'emergency': {
            'priority': 1,
            'max_response_time': '5_minutes',
            'escalation': 'immediate'
        },
        'appointment_request': {
            'priority': 2,
            'max_response_time': '1_hour'
        },
        'billing_inquiry': {
            'priority': 3,
            'max_response_time': '24_hours'
        }
    })
    
    enterprise.set_orchestration_rule('load_balancing', {
        'strategy': 'least_loaded',
        'health_check_interval': 60,
        'failover_enabled': True
    })
    
    # === Füge Integrationen hinzu ===
    enterprise.add_integration('apis', 'kvb_connect', {
        'endpoint': 'https://api.kvb.de',
        'auth_type': 'oauth2',
        'purpose': 'insurance_verification'
    })
    
    enterprise.add_integration('databases', 'patient_database', {
        'type': 'postgresql',
        'host': 'db.praxis.local',
        'encrypted': True,
        'backup_enabled': True
    })
    
    enterprise.add_integration('external_services', 'lab_interface', {
        'provider': 'labor_berlin',
        'protocol': 'HL7',
        'real_time_results': True
    })
    
    return enterprise


# ============= Demo-Ausführung =============
async def demo_enterprise_agent():
    """Demonstriere den Enterprise-Agent"""
    print("=== ENTERPRISE-AGENT DEMO ===")
    print("Komplette Praxisverwaltung mit KI\n")
    
    # Erstelle Enterprise-Agent
    praxis_agent = create_praxis_enterprise_agent()
    
    # Zeige Enterprise-Info
    info = praxis_agent.get_enterprise_info()
    print(f"Enterprise: {info['name']}")
    print(f"Firma: {info['company']}")
    print(f"Branche: {info['industry']}")
    print(f"Domains: {info['domains']}")
    print(f"Business-Prozesse: {info['business_processes']}")
    print(f"Compliance: {info['compliance']}")
    
    # === Test 1: Neue Patientenaufnahme ===
    print("\n\n--- TEST 1: Neue Patientenaufnahme ---")
    
    patient_onboarding_input = {
        'user': 'rezeption@praxis.de',
        'process_type': 'new_patient_onboarding',
        'email_text': '''Sehr geehrte Praxis Dr. Schmidt,
        
ich möchte mich gerne als neuer Patient bei Ihnen anmelden.
        
Name: Max Mustermann
Geburtsdatum: 15.03.1980
Krankenversicherung: AOK
Versicherungsnummer: A123456789

Ich benötige einen Termin für eine Erstuntersuchung.

Mit freundlichen Grüßen
Max Mustermann''',
        'insurance_valid': True,
        'consent_given': True
    }
    
    result = await praxis_agent.execute(patient_onboarding_input)
    
    if result['success']:
        print("✓ Patientenaufnahme erfolgreich!")
        print(f"  Request ID: {result['request_id']}")
        print(f"  Business-Prozess: {result['business_process']}")
        print(f"  Ausführungszeit: {result['execution_time']:.2f}s")
        
        # Zeige Prozess-Schritte
        print("\n  Ausgeführte Schritte:")
        for step in result['context']['workflow']:
            print(f"    • {step['step']}: {step.get('result', 'completed')}")
    
    # === Test 2: Notfall-Behandlung ===
    print("\n\n--- TEST 2: Notfall-Behandlung ---")
    
    emergency_input = {
        'user': 'notaufnahme@praxis.de',
        'email_text': 'NOTFALL! Patient mit akuten Brustschmerzen auf dem Weg zur Praxis!',
        'patient_id': 'P54321',
        'is_emergency': True
    }
    
    result = await praxis_agent.execute(emergency_input)
    
    if result['success']:
        print("✓ Notfall-Prozess aktiviert!")
        
        # Zeige spezielle Notfall-Behandlung
        actions = result['result'].get('actions_taken', [])
        print("\n  Notfall-Aktionen:")
        for action in actions:
            print(f"    • {action}")
            
        next_steps = result['result'].get('next_steps', [])
        if next_steps:
            print("\n  Empfohlene nächste Schritte:")
            for step in next_steps:
                print(f"    → {step}")
    
    # === Test 3: Compliance-Verletzung ===
    print("\n\n--- TEST 3: Compliance-Test ---")
    
    compliance_test_input = {
        'user': 'test@praxis.de',
        'action': 'access_patient_data',
        'patient_id': 'P99999',
        'purpose': 'marketing',  # Nicht erlaubt!
        'consent_given': False
    }
    
    result = await praxis_agent.execute(compliance_test_input)
    
    if not result['success']:
        print("✓ Compliance-Verletzung korrekt erkannt!")
        print(f"  Fehler: {result['error']}")
        print(f"  Support-Nachricht: {result.get('support_message', '')}")
    
    # === Test 4: Geschäftsprozess - Termin-Lifecycle ===
    print("\n\n--- TEST 4: Termin-Lifecycle ---")
    
    appointment_input = {
        'user': 'patient@example.com',
        'process_type': 'appointment_lifecycle',
        'email': {
            'subject': 'Terminanfrage',
            'body': 'Ich möchte einen Kontrolltermin vereinbaren.',
            'from': 'patient@example.com'
        },
        'patient_id': 'P12345',
        'requested_date': '2024-03-01',
        'requested_time': '10:00'
    }
    
    result = await praxis_agent.execute(appointment_input)
    
    if result['success']:
        print("✓ Termin-Prozess abgeschlossen!")
        
        # Zeige involvierte Domains
        print("\n  Involvierte Domains:")
        for domain, domain_result in result['context']['domain_results'].items():
            status = '✓' if domain_result.get('success') else '✗'
            print(f"    {status} {domain}")
    
    # === Zeige Monitoring & Metriken ===
    print("\n\n--- MONITORING & METRIKEN ---")
    
    monitoring = info['monitoring']
    print(f"Uptime: {monitoring['uptime']}")
    print(f"Total Requests: {monitoring['total_requests']}")
    print(f"Fehler: {monitoring['error_count']}")
    print(f"Compliance-Verletzungen: {monitoring['compliance_violations']}")
    
    print("\nDomain-Auslastung:")
    for domain, usage in monitoring['domain_usage'].items():
        print(f"  • {domain}: {usage['requests']} Requests")
    
    # === Generiere Report ===
    print("\n\n--- ENTERPRISE REPORT ---")
    
    report = await praxis_agent.generate_report('summary')
    print(f"Report generiert: {len(report)} Einträge")
    
    # Performance-Empfehlungen
    perf_report = await praxis_agent.generate_report('performance')
    if perf_report.get('recommendations'):
        print("\nPerformance-Empfehlungen:")
        for rec in perf_report['recommendations']:
            print(f"  ⚠ {rec}")


if __name__ == "__main__":
    # Führe Demo aus
    asyncio.run(demo_enterprise_agent())