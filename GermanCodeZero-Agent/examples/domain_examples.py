"""
Beispiel Domain-Agenten - Stufe 4
Komplette Fachbereiche mit mehreren Sub-Agenten
"""

import asyncio
from typing import Dict, Any, List
from datetime import datetime

# Add parent directory to path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.domain_agent import DomainAgent, DomainType
from core.sub_agent import SubAgent
from core.mikro_agent import MikroAgent
from core.nano_agent import NanoAgent


# ============= BEISPIEL 1: MailOps Domain-Agent =============
def create_mailops_domain() -> DomainAgent:
    """
    Erstelle einen kompletten MailOps Domain-Agent
    Verwaltet alle E-Mail-bezogenen Operationen
    """
    
    # === Sub-Agent 1: Inbox Manager ===
    def create_inbox_manager() -> SubAgent:
        # Mikro-Agent: Mail Sortierer
        def create_mail_sorter() -> MikroAgent:
            async def categorize_mail(**kwargs):
                emails = kwargs.get('emails', [])
                categorized = {
                    'urgent': [],
                    'appointments': [],
                    'invoices': [],
                    'general': [],
                    'spam': []
                }
                
                for email in emails:
                    subject = email.get('subject', '').lower()
                    sender = email.get('from', '').lower()
                    
                    if 'dringend' in subject or 'urgent' in subject:
                        categorized['urgent'].append(email)
                    elif 'termin' in subject or 'appointment' in subject:
                        categorized['appointments'].append(email)
                    elif 'rechnung' in subject or 'invoice' in subject:
                        categorized['invoices'].append(email)
                    elif 'noreply' in sender or 'newsletter' in sender:
                        categorized['spam'].append(email)
                    else:
                        categorized['general'].append(email)
                        
                return {'categorized_emails': categorized}
            
            async def prioritize_emails(**kwargs):
                categorized = kwargs.get('categorized_emails', {})
                priority_queue = []
                
                # Urgent zuerst
                for email in categorized.get('urgent', []):
                    priority_queue.append({**email, 'priority': 1})
                    
                # Dann Termine
                for email in categorized.get('appointments', []):
                    priority_queue.append({**email, 'priority': 2})
                    
                # Rechnungen
                for email in categorized.get('invoices', []):
                    priority_queue.append({**email, 'priority': 3})
                    
                # Rest
                for email in categorized.get('general', []):
                    priority_queue.append({**email, 'priority': 4})
                    
                return {'priority_queue': priority_queue}
            
            nano_agents = [
                NanoAgent("mail_categorizer", categorize_mail, "Kategorisiere E-Mails"),
                NanoAgent("mail_prioritizer", prioritize_emails, "Priorisiere E-Mails")
            ]
            
            return MikroAgent(
                name="mail_sorter",
                nano_agents=nano_agents,
                description="Sortiere und priorisiere E-Mails",
                pipeline_mode="sequential"
            )
        
        sub_agent = SubAgent(
            name="inbox_manager",
            description="Verwalte eingehende E-Mails"
        )
        
        sub_agent.add_mikro_agent(create_mail_sorter())
        return sub_agent
    
    # === Sub-Agent 2: Auto Responder ===
    def create_auto_responder() -> SubAgent:
        # Mikro-Agent: Response Generator
        def create_response_generator() -> MikroAgent:
            async def analyze_intent(**kwargs):
                email = kwargs.get('email', {})
                subject = email.get('subject', '').lower()
                body = email.get('body', '').lower()
                
                # Einfache Intent-Erkennung
                if 'termin' in subject or 'appointment' in body:
                    intent = 'appointment_request'
                elif 'rechnung' in subject or 'zahlung' in body:
                    intent = 'billing_inquiry'
                elif 'öffnungszeiten' in body or 'wann geöffnet' in body:
                    intent = 'hours_inquiry'
                else:
                    intent = 'general_inquiry'
                    
                return {
                    'intent': intent,
                    'confidence': 0.85,
                    'requires_human': intent == 'general_inquiry'
                }
            
            async def generate_response(**kwargs):
                intent = kwargs.get('intent')
                email = kwargs.get('email', {})
                
                templates = {
                    'appointment_request': '''Sehr geehrte/r {name},
                    
vielen Dank für Ihre Terminanfrage. Wir haben Ihre Nachricht erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.

Sie können auch gerne direkt online einen Termin buchen unter: www.praxis-beispiel.de/termine

Mit freundlichen Grüßen
Ihr Praxis-Team''',
                    
                    'billing_inquiry': '''Sehr geehrte/r {name},
                    
vielen Dank für Ihre Anfrage bezüglich der Rechnung. 

Für Abrechnungsfragen wenden Sie sich bitte direkt an unsere Abrechnungsabteilung:
- Telefon: 0123-456789
- E-Mail: abrechnung@praxis-beispiel.de

Mit freundlichen Grüßen
Ihr Praxis-Team''',
                    
                    'hours_inquiry': '''Sehr geehrte/r {name},
                    
unsere Öffnungszeiten sind:
- Montag bis Freitag: 08:00 - 18:00 Uhr
- Samstag: 09:00 - 13:00 Uhr
- Sonntag: geschlossen

Mit freundlichen Grüßen
Ihr Praxis-Team''',
                    
                    'general_inquiry': '''Sehr geehrte/r {name},
                    
vielen Dank für Ihre Nachricht. Ein Mitarbeiter wird sich in Kürze persönlich bei Ihnen melden.

Mit freundlichen Grüßen
Ihr Praxis-Team'''
                }
                
                response_text = templates.get(intent, templates['general_inquiry'])
                response_text = response_text.format(name=email.get('from', 'Patient'))
                
                return {
                    'response_text': response_text,
                    'response_type': 'auto_generated',
                    'template_used': intent
                }
            
            nano_agents = [
                NanoAgent("intent_analyzer", analyze_intent, "Analysiere E-Mail Intent"),
                NanoAgent("response_generator", generate_response, "Generiere Antwort")
            ]
            
            return MikroAgent(
                name="response_generator",
                nano_agents=nano_agents,
                description="Generiere automatische Antworten",
                pipeline_mode="sequential"
            )
        
        sub_agent = SubAgent(
            name="auto_responder",
            description="Automatische E-Mail-Antworten"
        )
        
        sub_agent.add_mikro_agent(create_response_generator())
        return sub_agent
    
    # === Sub-Agent 3: Mail Analytics ===
    def create_mail_analytics() -> SubAgent:
        # Mikro-Agent: Statistics Generator
        def create_stats_generator() -> MikroAgent:
            async def calculate_metrics(**kwargs):
                emails = kwargs.get('emails', [])
                
                # Berechne Metriken
                total_emails = len(emails)
                categories = {}
                response_times = []
                
                for email in emails:
                    cat = email.get('category', 'unknown')
                    categories[cat] = categories.get(cat, 0) + 1
                    
                return {
                    'total_emails': total_emails,
                    'categories': categories,
                    'avg_emails_per_day': total_emails / 7,  # Annahme: 7 Tage
                    'peak_hours': ['09:00-11:00', '14:00-16:00']
                }
            
            async def identify_trends(**kwargs):
                metrics = kwargs.get('metrics', {})
                
                trends = []
                
                # Trend-Analyse
                if metrics.get('avg_emails_per_day', 0) > 50:
                    trends.append({
                        'type': 'high_volume',
                        'description': 'Hohes E-Mail-Aufkommen',
                        'recommendation': 'Zusätzliche Ressourcen zuweisen'
                    })
                    
                categories = metrics.get('categories', {})
                if categories.get('appointments', 0) > categories.get('general', 0):
                    trends.append({
                        'type': 'appointment_heavy',
                        'description': 'Viele Terminanfragen',
                        'recommendation': 'Online-Terminbuchung promoten'
                    })
                    
                return {'trends': trends}
            
            nano_agents = [
                NanoAgent("metrics_calculator", calculate_metrics, "Berechne E-Mail Metriken"),
                NanoAgent("trend_identifier", identify_trends, "Identifiziere Trends")
            ]
            
            return MikroAgent(
                name="stats_generator",
                nano_agents=nano_agents,
                description="Generiere E-Mail Statistiken",
                pipeline_mode="sequential"
            )
        
        sub_agent = SubAgent(
            name="mail_analytics",
            description="Analysiere E-Mail Patterns und Trends"
        )
        
        sub_agent.add_mikro_agent(create_stats_generator())
        return sub_agent
    
    # === Erstelle Domain-Agent ===
    domain = DomainAgent(
        name="mailops_center",
        domain_type=DomainType.MAIL_OPS,
        description="Komplette E-Mail-Operations Verwaltung",
        policies={
            'retention': {
                'general_emails': '2_years',
                'medical_emails': '10_years',
                'spam': '30_days'
            },
            'auto_response': {
                'enabled': True,
                'max_per_sender': 1,
                'blacklist_domains': ['spam.com', 'phishing.net']
            },
            'security': {
                'scan_attachments': True,
                'block_executables': True,
                'phishing_detection': True
            }
        },
        integrations=['smtp_server', 'imap_server', 'spam_filter', 'antivirus']
    )
    
    # Füge Sub-Agenten mit Capabilities hinzu
    domain.add_sub_agent(create_inbox_manager(), [
        'sort_emails',
        'prioritize_urgent',
        'filter_spam',
        'categorize_incoming'
    ])
    
    domain.add_sub_agent(create_auto_responder(), [
        'send_confirmations',
        'answer_standard_queries',
        'vacation_replies',
        'appointment_confirmations'
    ])
    
    domain.add_sub_agent(create_mail_analytics(), [
        'track_metrics',
        'identify_trends',
        'generate_reports',
        'optimize_responses'
    ])
    
    # Setze Domain-spezifisches Wissen
    domain.set_domain_knowledge('email_templates', {
        'appointment_confirmation': 'Ihr Termin am {date} um {time} wurde bestätigt.',
        'appointment_reminder': 'Erinnerung: Ihr Termin ist morgen um {time}.',
        'general_receipt': 'Wir haben Ihre Nachricht erhalten.'
    })
    
    return domain


# ============= BEISPIEL 2: CalendarOps Domain-Agent =============
def create_calendarops_domain() -> DomainAgent:
    """
    Erstelle einen CalendarOps Domain-Agent
    Verwaltet alle Kalender-bezogenen Operationen
    """
    
    # === Sub-Agent 1: Schedule Manager ===
    def create_schedule_manager() -> SubAgent:
        # Implementation vereinfacht für Demo
        sub_agent = SubAgent(
            name="schedule_manager",
            description="Verwalte Arzt-Zeitpläne und Verfügbarkeiten"
        )
        
        # Mikro-Agent würde hier hinzugefügt
        return sub_agent
    
    # === Sub-Agent 2: Appointment Optimizer ===
    def create_appointment_optimizer() -> SubAgent:
        sub_agent = SubAgent(
            name="appointment_optimizer",
            description="Optimiere Terminvergabe und reduziere Wartezeiten"
        )
        
        # Mikro-Agent würde hier hinzugefügt
        return sub_agent
    
    # === Sub-Agent 3: Reminder Service ===
    def create_reminder_service() -> SubAgent:
        sub_agent = SubAgent(
            name="reminder_service",
            description="Sende Terminerinnerungen und verwalte No-Shows"
        )
        
        # Mikro-Agent würde hier hinzugefügt
        return sub_agent
    
    # === Erstelle Domain-Agent ===
    domain = DomainAgent(
        name="calendarops_center",
        domain_type=DomainType.CALENDAR_OPS,
        description="Komplette Kalender- und Terminverwaltung",
        policies={
            'booking_rules': {
                'advance_booking_days': 90,
                'min_appointment_duration': 15,
                'buffer_between_appointments': 5,
                'overbooking_allowed': False
            },
            'cancellation': {
                'min_hours_notice': 24,
                'max_cancellations_per_patient': 3,
                'penalty_after_max': True
            },
            'reminders': {
                'first_reminder': '48_hours',
                'second_reminder': '24_hours',
                'final_reminder': '2_hours'
            }
        },
        integrations=['google_calendar', 'outlook', 'sms_gateway', 'email_service']
    )
    
    # Füge Sub-Agenten hinzu
    domain.add_sub_agent(create_schedule_manager(), [
        'manage_availability',
        'block_time_slots',
        'handle_vacations',
        'emergency_slots'
    ])
    
    domain.add_sub_agent(create_appointment_optimizer(), [
        'optimize_schedule',
        'reduce_wait_times',
        'batch_similar_appointments',
        'predict_no_shows'
    ])
    
    domain.add_sub_agent(create_reminder_service(), [
        'send_reminders',
        'track_confirmations',
        'manage_no_shows',
        'waitlist_notifications'
    ])
    
    return domain


# ============= Demo-Ausführung =============
async def demo_domain_agents():
    """Demonstriere die Domain-Agenten"""
    print("=== DOMAIN-AGENT DEMO ===\n")
    
    # 1. MailOps Domain
    print("\n--- MAILOPS DOMAIN ---")
    mailops = create_mailops_domain()
    
    # Simuliere eingehende E-Mails
    mail_input = {
        'action': 'process_incoming',
        'emails': [
            {
                'id': 'mail_1',
                'from': 'patient1@example.com',
                'subject': 'DRINGEND: Brauche heute noch einen Termin',
                'body': 'Habe starke Schmerzen...',
                'received_at': datetime.now().isoformat()
            },
            {
                'id': 'mail_2',
                'from': 'patient2@example.com',
                'subject': 'Terminanfrage nächste Woche',
                'body': 'Möchte gerne einen Kontrolltermin vereinbaren.',
                'received_at': datetime.now().isoformat()
            },
            {
                'id': 'mail_3',
                'from': 'lieferant@medical.com',
                'subject': 'Rechnung Nr. 2024-4567',
                'body': 'Anbei die Rechnung für Ihre Bestellung.',
                'attachments': ['rechnung.pdf'],
                'received_at': datetime.now().isoformat()
            },
            {
                'id': 'mail_4',
                'from': 'newsletter@spam.com',
                'subject': 'Gewinnspiel!!!',
                'body': 'Sie haben gewonnen! Klicken Sie hier...',
                'received_at': datetime.now().isoformat()
            }
        ]
    }
    
    # Führe Domain-Agent aus
    result = await mailops.execute(mail_input)
    
    if result['success']:
        print("✓ MailOps erfolgreich ausgeführt!")
        print(f"\nDomain: {result['domain']}")
        print(f"Request-Typ: {result['request_type']}")
        
        # Zeige Routing-Entscheidungen
        print("\nRouting-Entscheidungen:")
        for decision in result['domain_context']['routing_decisions']:
            print(f"  - {decision['request_type']} → {decision['selected_agent']} ({decision['reason']})")
            
        # Zeige Ergebnisse der Sub-Agenten
        print("\nSub-Agent Ergebnisse:")
        for sub_result in result['domain_context']['sub_agent_results']:
            print(f"  - {sub_result['agent']}: {'✓' if sub_result['success'] else '✗'}")
            
        # Zeige finale Aggregation
        final_result = result['result']
        print(f"\nFinale Aggregation:")
        print(f"  - E-Mails verarbeitet: {final_result.get('mails_processed', 0)}")
        print(f"  - Aktionen: {final_result.get('actions_taken', [])}")
    
    # Test Policy-Enforcement
    print("\n\nTest: Policy-Verletzung")
    policy_test_input = {
        'action': 'auto_respond',
        'email': {
            'from': 'blocked@spam.com',  # Blacklisted domain
            'subject': 'Test',
            'body': 'Test message'
        }
    }
    
    result = await mailops.execute(policy_test_input)
    
    if not result['success']:
        print(f"✓ Policy korrekt durchgesetzt: {result.get('error')}")
    
    # 2. CalendarOps Domain (vereinfacht)
    print("\n\n--- CALENDAROPS DOMAIN ---")
    calendarops = create_calendarops_domain()
    
    calendar_input = {
        'action': 'book_appointment',
        'patient_id': 'P12345',
        'requested_date': '2024-02-20',
        'requested_time': '10:00',
        'appointment_type': 'checkup',
        'duration_minutes': 30
    }
    
    # Info über Domain
    domain_info = calendarops.get_domain_info()
    print(f"Domain: {domain_info['name']}")
    print(f"Typ: {domain_info['type']}")
    print(f"Sub-Agenten: {domain_info['sub_agents']}")
    print(f"Capabilities: {domain_info['capabilities']}")
    print(f"Policies: {list(domain_info['policies'].keys())}")
    
    # Zeige Domain-Metriken
    print("\n\nDomain-Metriken:")
    print(f"  - Total Requests: {domain_info['metrics']['total_requests']}")
    print(f"  - Success Rate: {domain_info['metrics']['successful_requests']}/{domain_info['metrics']['total_requests']}")
    print(f"  - Avg Response Time: {domain_info['metrics']['average_response_time']:.2f}ms")


if __name__ == "__main__":
    # Führe Demo aus
    asyncio.run(demo_domain_agents())