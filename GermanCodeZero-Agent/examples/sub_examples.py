"""
Beispiel Sub-Agenten - Stufe 3
Teilprozesse mit Entscheidungslogik
"""

import asyncio
from typing import Dict, Any, List
from datetime import datetime, timedelta

# Add parent directory to path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.sub_agent import SubAgent
from core.mikro_agent import MikroAgent
from core.nano_agent import NanoAgent


# ============= BEISPIEL 1: Intelligenter Termin-Agent =============
def create_intelligent_appointment_agent() -> SubAgent:
    """
    Erstelle einen intelligenten Termin-Agent mit Entscheidungslogik
    - Erkennt Termin-Typ aus E-Mail
    - Prüft Kalender und Ressourcen
    - Entscheidet über Buchungsstrategie
    - Handhabt Sonderfälle (Notfall, VIP, etc.)
    """
    
    # === Mikro-Agent 1: E-Mail Analyse ===
    def create_email_analyzer() -> MikroAgent:
        async def extract_appointment_info(**kwargs):
            email_text = kwargs.get('email_text', '')
            
            # Simuliere Extraktion
            is_urgent = 'dringend' in email_text.lower() or 'notfall' in email_text.lower()
            is_follow_up = 'nachuntersuchung' in email_text.lower()
            
            return {
                'appointment_type': 'emergency' if is_urgent else ('follow_up' if is_follow_up else 'regular'),
                'urgency_level': 'high' if is_urgent else 'normal',
                'requested_dates': ['morgen', 'diese Woche'],
                'patient_info': {
                    'name': 'Max Mustermann',
                    'id': 'P12345',
                    'is_vip': False
                }
            }
        
        async def check_patient_history(**kwargs):
            patient_id = kwargs.get('patient_info', {}).get('id')
            
            return {
                'patient_id': patient_id,
                'last_appointment': '2024-01-15',
                'no_shows': 0,
                'total_appointments': 5,
                'special_requirements': ['Rollstuhl-zugänglich']
            }
        
        nano_agents = [
            NanoAgent("appointment_extractor", extract_appointment_info, "Extrahiere Termin-Info aus E-Mail"),
            NanoAgent("history_checker", check_patient_history, "Prüfe Patienten-Historie")
        ]
        
        return MikroAgent(
            name="email_analyzer",
            nano_agents=nano_agents,
            description="Analysiere E-Mail und Patienten-Info",
            pipeline_mode="sequential"
        )
    
    # === Mikro-Agent 2: Kalender-Management ===
    def create_calendar_manager() -> MikroAgent:
        async def find_available_slots(**kwargs):
            urgency = kwargs.get('urgency_level', 'normal')
            appointment_type = kwargs.get('appointment_type', 'regular')
            
            # Unterschiedliche Strategien basierend auf Urgency
            if urgency == 'high' or appointment_type == 'emergency':
                # Notfall: Suche heute/morgen
                slots = [
                    {'date': datetime.now().strftime('%Y-%m-%d'), 'time': '16:00', 'type': 'emergency_slot'},
                    {'date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'), 'time': '08:00', 'type': 'first_slot'}
                ]
            else:
                # Normal: Reguläre Slots
                slots = [
                    {'date': (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'), 'time': '10:00', 'type': 'regular'},
                    {'date': (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'), 'time': '14:00', 'type': 'regular'},
                    {'date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'), 'time': '11:30', 'type': 'regular'}
                ]
            
            return {
                'available_slots': slots,
                'search_strategy': 'emergency' if urgency == 'high' else 'regular'
            }
        
        async def check_resource_availability(**kwargs):
            slots = kwargs.get('available_slots', [])
            special_requirements = kwargs.get('special_requirements', [])
            
            # Prüfe Ressourcen für jeden Slot
            verified_slots = []
            for slot in slots:
                slot['resources_available'] = True
                if 'Rollstuhl-zugänglich' in special_requirements:
                    # Nur bestimmte Räume
                    slot['room'] = 'Raum 1 (barrierefrei)'
                else:
                    slot['room'] = 'Raum 2'
                verified_slots.append(slot)
                
            return {'verified_slots': verified_slots}
        
        nano_agents = [
            NanoAgent("slot_finder", find_available_slots, "Finde verfügbare Termine"),
            NanoAgent("resource_checker", check_resource_availability, "Prüfe Ressourcen-Verfügbarkeit")
        ]
        
        return MikroAgent(
            name="calendar_manager",
            nano_agents=nano_agents,
            description="Verwalte Kalender und Ressourcen",
            pipeline_mode="sequential"
        )
    
    # === Mikro-Agent 3: Buchungs-Prozessor ===
    def create_booking_processor() -> MikroAgent:
        async def create_appointment(**kwargs):
            slot = kwargs.get('selected_slot', {})
            patient_info = kwargs.get('patient_info', {})
            
            appointment = {
                'id': f'APT_{datetime.now().timestamp()}',
                'patient_id': patient_info.get('id'),
                'patient_name': patient_info.get('name'),
                'date': slot.get('date'),
                'time': slot.get('time'),
                'room': slot.get('room'),
                'type': kwargs.get('appointment_type'),
                'created_at': datetime.now().isoformat()
            }
            
            return {'appointment': appointment, 'created': True}
        
        async def send_notifications(**kwargs):
            appointment = kwargs.get('appointment', {})
            notifications_sent = []
            
            # Patient Benachrichtigung
            notifications_sent.append({
                'type': 'email',
                'recipient': f"{appointment['patient_name']} <patient@example.com>",
                'subject': f"Terminbestätigung: {appointment['date']} um {appointment['time']}",
                'sent': True
            })
            
            # Bei Notfall: Arzt benachrichtigen
            if appointment.get('type') == 'emergency':
                notifications_sent.append({
                    'type': 'sms',
                    'recipient': 'Dr. Schmidt',
                    'message': f"Notfall-Termin: {appointment['patient_name']} am {appointment['date']}",
                    'sent': True
                })
                
            return {'notifications': notifications_sent}
        
        async def update_systems(**kwargs):
            appointment = kwargs.get('appointment', {})
            
            updates = [
                {'system': 'calendar', 'status': 'updated'},
                {'system': 'patient_db', 'status': 'updated'},
                {'system': 'billing', 'status': 'pending'}
            ]
            
            return {'system_updates': updates}
        
        nano_agents = [
            NanoAgent("appointment_creator", create_appointment, "Erstelle Termin"),
            NanoAgent("notification_sender", send_notifications, "Sende Benachrichtigungen"),
            NanoAgent("system_updater", update_systems, "Aktualisiere Systeme")
        ]
        
        return MikroAgent(
            name="booking_processor",
            nano_agents=nano_agents,
            description="Prozessiere Buchung und Updates",
            pipeline_mode="sequential"
        )
    
    # === Erstelle Sub-Agent ===
    sub_agent = SubAgent(
        name="intelligent_appointment_agent",
        description="Intelligenter Termin-Agent mit komplexer Entscheidungslogik",
        decision_logic={
            'stop_on_error': False,
            'max_retries': 2,
            'required_fields': ['email_text']
        }
    )
    
    # Füge Mikro-Agenten hinzu
    sub_agent.add_mikro_agent(create_email_analyzer())
    sub_agent.add_mikro_agent(create_calendar_manager())
    sub_agent.add_mikro_agent(create_booking_processor())
    
    # Definiere Workflows
    sub_agent.define_workflow('standard_booking', [
        'email_analyzer',
        'calendar_manager',
        'booking_processor'
    ])
    
    sub_agent.define_workflow('emergency_booking', [
        'email_analyzer',
        'calendar_manager',  # Mit emergency flag
        'booking_processor'
    ])
    
    # Füge Entscheidungslogik hinzu
    def is_emergency(context: Dict[str, Any]) -> bool:
        """Prüfe ob Notfall"""
        results = context.get('results', [])
        if results and len(results) > 0:
            first_result = results[0]
            appointment_type = first_result.get('result', {}).get('appointment_type')
            return appointment_type == 'emergency'
        return False
    
    # Error Handler
    async def handle_no_slots_error(error: Exception, context: Dict[str, Any]):
        """Handle wenn keine Slots verfügbar"""
        return {
            'fallback': 'waiting_list',
            'message': 'Keine Termine verfügbar, Patient auf Warteliste gesetzt'
        }
    
    sub_agent.set_error_handler('NoSlotsAvailable', handle_no_slots_error)
    
    return sub_agent


# ============= BEISPIEL 2: Compliance-Check Agent =============
def create_compliance_agent() -> SubAgent:
    """
    Erstelle einen Compliance-Agent für medizinische Dokumente
    - Prüft DSGVO-Konformität
    - Validiert Rezepte
    - Überwacht Zugriffe
    """
    
    # === Mikro-Agent 1: Datenschutz-Prüfer ===
    def create_privacy_checker() -> MikroAgent:
        async def check_data_classification(**kwargs):
            document = kwargs.get('document', {})
            
            # Simuliere Daten-Klassifikation
            sensitive_fields = []
            if 'patient_name' in str(document):
                sensitive_fields.append('patient_name')
            if 'diagnosis' in str(document):
                sensitive_fields.append('medical_data')
                
            return {
                'classification': 'highly_sensitive' if sensitive_fields else 'normal',
                'sensitive_fields': sensitive_fields,
                'requires_encryption': len(sensitive_fields) > 0
            }
        
        async def verify_consent(**kwargs):
            patient_id = kwargs.get('patient_id')
            purpose = kwargs.get('purpose', 'treatment')
            
            # Simuliere Consent-Check
            consent_given = True  # In Produktion: DB-Abfrage
            
            return {
                'consent_checked': True,
                'consent_given': consent_given,
                'consent_type': purpose,
                'valid_until': '2025-12-31'
            }
        
        nano_agents = [
            NanoAgent("data_classifier", check_data_classification, "Klassifiziere Daten"),
            NanoAgent("consent_verifier", verify_consent, "Prüfe Einwilligung")
        ]
        
        return MikroAgent(
            name="privacy_checker",
            nano_agents=nano_agents,
            description="Prüfe Datenschutz-Compliance",
            pipeline_mode="sequential"
        )
    
    # === Mikro-Agent 2: Medizinische Validierung ===
    def create_medical_validator() -> MikroAgent:
        async def validate_prescription(**kwargs):
            prescription = kwargs.get('prescription', {})
            
            issues = []
            
            # Prüfe Rezeptpflicht
            medication = prescription.get('medication', '')
            if medication.lower() in ['morphin', 'fentanyl']:
                issues.append({
                    'type': 'controlled_substance',
                    'severity': 'high',
                    'requires': 'btm_prescription'
                })
                
            # Prüfe Dosierung
            dosage = prescription.get('dosage', '')
            if 'mg' in dosage:
                dosage_value = int(''.join(filter(str.isdigit, dosage.split('mg')[0])))
                if dosage_value > 1000:
                    issues.append({
                        'type': 'high_dosage',
                        'severity': 'medium',
                        'requires': 'doctor_review'
                    })
                    
            return {
                'valid': len(issues) == 0,
                'issues': issues,
                'prescription_type': 'btm' if any(i['type'] == 'controlled_substance' for i in issues) else 'regular'
            }
        
        async def check_interactions(**kwargs):
            medication = kwargs.get('medication')
            patient_medications = kwargs.get('current_medications', [])
            
            # Simuliere Interaktions-Check
            interactions = []
            if 'aspirin' in patient_medications and 'ibuprofen' in medication.lower():
                interactions.append({
                    'severity': 'moderate',
                    'description': 'Erhöhtes Blutungsrisiko',
                    'recommendation': 'Alternative erwägen'
                })
                
            return {
                'interactions_found': len(interactions) > 0,
                'interactions': interactions
            }
        
        nano_agents = [
            NanoAgent("prescription_validator", validate_prescription, "Validiere Rezept"),
            NanoAgent("interaction_checker", check_interactions, "Prüfe Wechselwirkungen")
        ]
        
        return MikroAgent(
            name="medical_validator", 
            nano_agents=nano_agents,
            description="Validiere medizinische Dokumente",
            pipeline_mode="sequential"
        )
    
    # === Mikro-Agent 3: Audit Logger ===
    def create_audit_logger() -> MikroAgent:
        async def log_access(**kwargs):
            return {
                'access_id': f'ACC_{datetime.now().timestamp()}',
                'user': kwargs.get('user', 'system'),
                'action': kwargs.get('action', 'read'),
                'resource': kwargs.get('resource'),
                'timestamp': datetime.now().isoformat(),
                'ip_address': '192.168.1.100'
            }
        
        async def generate_compliance_report(**kwargs):
            checks_performed = kwargs.get('checks_performed', [])
            
            report = {
                'report_id': f'RPT_{datetime.now().timestamp()}',
                'date': datetime.now().isoformat(),
                'compliance_status': 'passed' if all(c.get('passed', False) for c in checks_performed) else 'failed',
                'checks': checks_performed,
                'recommendations': []
            }
            
            # Füge Empfehlungen hinzu
            for check in checks_performed:
                if not check.get('passed', False):
                    report['recommendations'].append(check.get('recommendation', 'Review required'))
                    
            return {'report': report}
        
        nano_agents = [
            NanoAgent("access_logger", log_access, "Logge Zugriff"),
            NanoAgent("report_generator", generate_compliance_report, "Erstelle Compliance-Report")
        ]
        
        return MikroAgent(
            name="audit_logger",
            nano_agents=nano_agents,
            description="Audit und Reporting",
            pipeline_mode="sequential"
        )
    
    # === Erstelle Sub-Agent ===
    sub_agent = SubAgent(
        name="compliance_agent",
        description="Überwacht Compliance und Datenschutz",
        decision_logic={
            'stop_on_violation': True,
            'escalation_required': True
        }
    )
    
    # Füge Mikro-Agenten hinzu
    sub_agent.add_mikro_agent(create_privacy_checker())
    sub_agent.add_mikro_agent(create_medical_validator())
    sub_agent.add_mikro_agent(create_audit_logger())
    
    # Definiere Workflows
    sub_agent.define_workflow('document_check', [
        'privacy_checker',
        'audit_logger'
    ])
    
    sub_agent.define_workflow('prescription_check', [
        'privacy_checker',
        'medical_validator',
        'audit_logger'
    ])
    
    # Entscheidungslogik
    def requires_medical_validation(context: Dict[str, Any]) -> bool:
        """Prüfe ob medizinische Validierung nötig"""
        input_data = context.get('input', {})
        return 'prescription' in input_data or 'medication' in input_data
    
    # Error Handler für Compliance-Verletzungen
    async def handle_compliance_violation(error: Exception, context: Dict[str, Any]):
        """Handle Compliance-Verletzungen"""
        # Eskaliere an Compliance Officer
        return {
            'escalated': True,
            'escalation_level': 'compliance_officer',
            'immediate_action': 'block_access',
            'notification_sent': True
        }
    
    sub_agent.set_error_handler('ComplianceViolation', handle_compliance_violation)
    
    return sub_agent


# ============= Demo-Ausführung =============
async def demo_sub_agents():
    """Demonstriere die Sub-Agenten"""
    print("=== SUB-AGENT DEMO ===\n")
    
    # 1. Intelligenter Termin-Agent
    print("\n--- INTELLIGENTER TERMIN-AGENT ---")
    appointment_agent = create_intelligent_appointment_agent()
    
    # Test 1: Regulärer Termin
    print("\nTest 1: Regulärer Termin")
    regular_input = {
        'email_text': 'Sehr geehrte Praxis, ich möchte gerne einen Termin für eine Routineuntersuchung vereinbaren. Mit freundlichen Grüßen, Max Mustermann'
    }
    
    result = await appointment_agent.execute(regular_input)
    
    if result['success']:
        print("✓ Termin erfolgreich verarbeitet!")
        # Zeige Entscheidungspfad
        for i, decision in enumerate(result['process_context']['decisions']):
            print(f"  Entscheidung {i+1}: {decision}")
            
        # Zeige finales Ergebnis
        final_result = result['final_result']
        if isinstance(final_result, list) and len(final_result) > 0:
            booking_result = final_result[-1]['result']
            appointment = booking_result.get('appointment', {})
            print(f"\n  Gebuchter Termin:")
            print(f"    - Datum: {appointment.get('date')}")
            print(f"    - Zeit: {appointment.get('time')}")
            print(f"    - Raum: {appointment.get('room')}")
            print(f"    - ID: {appointment.get('id')}")
    
    # Test 2: Notfall-Termin
    print("\n\nTest 2: Notfall-Termin")
    emergency_input = {
        'email_text': 'DRINGEND! Notfall - Patient hat starke Schmerzen und benötigt sofort einen Termin! Bitte um schnelle Rückmeldung.'
    }
    
    result = await appointment_agent.execute(emergency_input)
    
    if result['success']:
        print("✓ Notfall-Termin erfolgreich verarbeitet!")
        
        # Zeige spezielle Notfall-Behandlung
        appointment_type = result['domain_results']['email_analyzer']['result']['appointment_type']
        print(f"  Erkannter Typ: {appointment_type}")
        
        # Notfall-Benachrichtigungen
        notifications = result['domain_results']['booking_processor']['result']['notifications']
        print(f"\n  Gesendete Benachrichtigungen:")
        for notif in notifications:
            print(f"    - {notif['type']}: {notif['recipient']}")
    
    # 2. Compliance-Agent
    print("\n\n--- COMPLIANCE-AGENT ---")
    compliance_agent = create_compliance_agent()
    
    # Test 1: Normales Dokument
    print("\nTest 1: Normales Dokument")
    normal_doc_input = {
        'document': {
            'type': 'lab_result',
            'content': 'Laborergebnisse vom 15.01.2024'
        },
        'user': 'nurse_schmidt',
        'action': 'read'
    }
    
    result = await compliance_agent.execute(normal_doc_input)
    
    if result['success']:
        print("✓ Compliance-Check bestanden!")
        privacy_result = result['domain_results']['privacy_checker']['result']
        print(f"  Daten-Klassifikation: {privacy_result['classification']}")
        print(f"  Verschlüsselung nötig: {privacy_result['requires_encryption']}")
    
    # Test 2: Rezept mit BTM
    print("\n\nTest 2: BTM-Rezept")
    prescription_input = {
        'prescription': {
            'medication': 'Morphin',
            'dosage': '10mg',
            'patient_id': 'P12345'
        },
        'current_medications': ['Aspirin'],
        'user': 'dr_mueller',
        'action': 'prescribe'
    }
    
    result = await compliance_agent.execute(prescription_input)
    
    if result['success']:
        validation_result = result['domain_results']['medical_validator']['result']
        print(f"✓ Rezept-Validierung abgeschlossen")
        print(f"  Gültig: {validation_result['valid']}")
        
        if validation_result['issues']:
            print(f"  Gefundene Probleme:")
            for issue in validation_result['issues']:
                print(f"    - {issue['type']} ({issue['severity']}): {issue['requires']}")
                
        # Compliance Report
        report = result['domain_results']['audit_logger']['result']['report']
        print(f"\n  Compliance-Report ID: {report['report_id']}")
        print(f"  Status: {report['compliance_status']}")


if __name__ == "__main__":
    # Führe Demo aus
    asyncio.run(demo_sub_agents())