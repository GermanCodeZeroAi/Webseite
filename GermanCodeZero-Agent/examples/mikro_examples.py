"""
Beispiel Mikro-Agenten - Stufe 2
Kombinieren mehrere Nano-Agenten zu funktionalen Modulen
"""

import asyncio
from typing import Dict, Any, List
from datetime import datetime

# Add parent directory to path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.mikro_agent import MikroAgent
from core.nano_agent import NanoAgent


# ============= BEISPIEL 1: Mail-Verarbeitungs-Pipeline =============
def create_mail_processing_pipeline() -> MikroAgent:
    """
    Erstelle eine komplette Mail-Verarbeitungs-Pipeline
    IMAP-Connect → Fetch → Parse → Classify → Save
    """
    
    # Nano-Agent 1: IMAP Verbindung
    async def connect_imap(**kwargs):
        return {
            'connected': True,
            'connection_id': f'conn_{datetime.now().timestamp()}',
            'server': kwargs.get('server'),
            'mailbox_count': 5
        }
    
    # Nano-Agent 2: E-Mails abrufen
    async def fetch_emails(**kwargs):
        connection_id = kwargs.get('connection_id')
        return {
            'emails': [
                {
                    'id': 'mail_1',
                    'subject': 'Terminanfrage für nächste Woche',
                    'from': 'patient@example.com',
                    'body': 'Sehr geehrte Praxis, ich würde gerne einen Termin vereinbaren...',
                    'date': datetime.now().isoformat()
                },
                {
                    'id': 'mail_2',
                    'subject': 'Rechnung Nr. 2024-001',
                    'from': 'lieferant@example.com',
                    'body': 'Anbei die Rechnung für die Lieferung...',
                    'date': datetime.now().isoformat(),
                    'attachments': ['rechnung_2024_001.pdf']
                }
            ]
        }
    
    # Nano-Agent 3: E-Mail parsen
    async def parse_email(**kwargs):
        emails = kwargs.get('emails', [])
        parsed = []
        
        for email in emails:
            parsed.append({
                'id': email['id'],
                'entities': {
                    'dates': ['nächste Woche'] if 'Termin' in email.get('subject', '') else [],
                    'numbers': ['2024-001'] if 'Rechnung' in email.get('subject', '') else [],
                    'keywords': ['Terminanfrage', 'Rechnung', 'Lieferung']
                },
                'has_attachments': bool(email.get('attachments')),
                'language': 'de'
            })
            
        return {'parsed_emails': parsed}
    
    # Nano-Agent 4: E-Mail klassifizieren
    async def classify_email(**kwargs):
        parsed_emails = kwargs.get('parsed_emails', [])
        classifications = []
        
        for email in parsed_emails:
            # Einfache Regel-basierte Klassifikation
            category = 'other'
            priority = 'normal'
            
            keywords = email.get('entities', {}).get('keywords', [])
            if 'Terminanfrage' in keywords:
                category = 'appointment'
                priority = 'high'
            elif 'Rechnung' in keywords:
                category = 'invoice'
                priority = 'medium'
                
            classifications.append({
                'id': email['id'],
                'category': category,
                'priority': priority,
                'confidence': 0.85
            })
            
        return {'classifications': classifications}
    
    # Nano-Agent 5: In Datenbank speichern
    async def save_to_db(**kwargs):
        classifications = kwargs.get('classifications', [])
        saved_records = []
        
        for item in classifications:
            saved_records.append({
                'record_id': f'rec_{item["id"]}',
                'saved_at': datetime.now().isoformat(),
                'table': f'emails_{item["category"]}'
            })
            
        return {
            'success': True,
            'records_saved': len(saved_records),
            'records': saved_records
        }
    
    # Erstelle Nano-Agenten
    nano_agents = [
        NanoAgent("imap_connect", connect_imap, "Stelle IMAP-Verbindung her"),
        NanoAgent("email_fetch", fetch_emails, "Hole E-Mails aus Postfach"),
        NanoAgent("email_parse", parse_email, "Parse E-Mail Inhalt"),
        NanoAgent("email_classify", classify_email, "Klassifiziere E-Mails"),
        NanoAgent("db_save", save_to_db, "Speichere in Datenbank")
    ]
    
    # Erstelle Mikro-Agent
    return MikroAgent(
        name="mail_processor",
        nano_agents=nano_agents,
        description="Komplette E-Mail-Verarbeitungs-Pipeline",
        pipeline_mode="sequential"
    )


# ============= BEISPIEL 2: Dokument-Analyse (Parallel) =============
def create_document_analyzer() -> MikroAgent:
    """
    Erstelle einen Dokument-Analyse Mikro-Agent
    Führt mehrere Analysen PARALLEL aus
    """
    
    # Nano-Agent 1: Text-Extraktion
    async def extract_text(**kwargs):
        document = kwargs.get('document', {})
        await asyncio.sleep(0.5)  # Simuliere Verarbeitung
        return {
            'text': 'Dies ist der extrahierte Text aus dem Dokument...',
            'page_count': 3,
            'word_count': 250
        }
    
    # Nano-Agent 2: Sprach-Erkennung
    async def detect_language(**kwargs):
        document = kwargs.get('document', {})
        await asyncio.sleep(0.3)
        return {
            'language': 'de',
            'confidence': 0.95,
            'alternatives': ['en', 'fr']
        }
    
    # Nano-Agent 3: Sentiment-Analyse
    async def analyze_sentiment(**kwargs):
        document = kwargs.get('document', {})
        await asyncio.sleep(0.4)
        return {
            'sentiment': 'neutral',
            'score': 0.1,
            'emotions': {
                'joy': 0.2,
                'anger': 0.1,
                'fear': 0.05,
                'sadness': 0.15
            }
        }
    
    # Nano-Agent 4: Entity-Extraktion
    async def extract_entities(**kwargs):
        document = kwargs.get('document', {})
        await asyncio.sleep(0.6)
        return {
            'entities': {
                'persons': ['Max Mustermann', 'Dr. Schmidt'],
                'organizations': ['Beispiel GmbH'],
                'locations': ['Berlin', 'München'],
                'dates': ['2024-01-15', 'nächste Woche']
            }
        }
    
    # Erstelle Nano-Agenten
    nano_agents = [
        NanoAgent("text_extractor", extract_text, "Extrahiere Text aus Dokument"),
        NanoAgent("language_detector", detect_language, "Erkenne Sprache"),
        NanoAgent("sentiment_analyzer", analyze_sentiment, "Analysiere Stimmung"),
        NanoAgent("entity_extractor", extract_entities, "Extrahiere Entitäten")
    ]
    
    # Erstelle Mikro-Agent mit paralleler Ausführung
    return MikroAgent(
        name="document_analyzer",
        nano_agents=nano_agents,
        description="Analysiere Dokumente mit mehreren parallelen Analysen",
        pipeline_mode="parallel"
    )


# ============= BEISPIEL 3: Termin-Buchungs-Modul =============
def create_appointment_booker() -> MikroAgent:
    """
    Erstelle ein Termin-Buchungs-Modul
    Prüfe Verfügbarkeit → Finde Slot → Erstelle Termin → Sende Bestätigung
    """
    
    # Nano-Agent 1: Verfügbarkeit prüfen
    async def check_availability(**kwargs):
        requested_date = kwargs.get('date')
        requested_time = kwargs.get('time')
        
        # Simuliere Kalender-Check
        conflicts = []
        if requested_time == '10:00':
            conflicts.append({
                'time': '10:00-11:00',
                'title': 'Anderer Termin'
            })
            
        return {
            'available': len(conflicts) == 0,
            'conflicts': conflicts,
            'checked_date': requested_date
        }
    
    # Nano-Agent 2: Alternative Slots finden
    async def find_alternative_slots(**kwargs):
        if kwargs.get('available', True):
            return {'alternatives_needed': False}
            
        return {
            'alternatives_needed': True,
            'suggested_slots': [
                {'date': kwargs.get('date'), 'time': '11:00'},
                {'date': kwargs.get('date'), 'time': '14:00'},
                {'date': kwargs.get('date'), 'time': '15:30'}
            ]
        }
    
    # Nano-Agent 3: Termin erstellen
    async def create_appointment(**kwargs):
        # Wähle finalen Slot
        if kwargs.get('available'):
            final_time = kwargs.get('time')
        else:
            alternatives = kwargs.get('suggested_slots', [])
            final_time = alternatives[0]['time'] if alternatives else '16:00'
            
        appointment_id = f'apt_{datetime.now().timestamp()}'
        
        return {
            'appointment_id': appointment_id,
            'date': kwargs.get('date'),
            'time': final_time,
            'patient': kwargs.get('patient_name'),
            'created': True
        }
    
    # Nano-Agent 4: Bestätigung senden
    async def send_confirmation(**kwargs):
        appointment = kwargs.get('appointment_id')
        patient_email = kwargs.get('patient_email', 'patient@example.com')
        
        return {
            'confirmation_sent': True,
            'sent_to': patient_email,
            'appointment_id': appointment,
            'message_id': f'msg_{datetime.now().timestamp()}'
        }
    
    # Erstelle Nano-Agenten
    nano_agents = [
        NanoAgent("availability_checker", check_availability, "Prüfe Kalender-Verfügbarkeit"),
        NanoAgent("slot_finder", find_alternative_slots, "Finde alternative Termine"),
        NanoAgent("appointment_creator", create_appointment, "Erstelle Termin"),
        NanoAgent("confirmation_sender", send_confirmation, "Sende Bestätigung")
    ]
    
    return MikroAgent(
        name="appointment_booker",
        nano_agents=nano_agents,
        description="Intelligente Terminbuchung mit Alternativ-Vorschlägen",
        pipeline_mode="sequential"
    )


# ============= Demo-Ausführung =============
async def demo_mikro_agents():
    """Demonstriere die Mikro-Agenten"""
    print("=== MIKRO-AGENT DEMO ===\n")
    
    # 1. Mail-Verarbeitung (Sequential)
    print("\n--- MAIL PROCESSING PIPELINE ---")
    mail_processor = create_mail_processing_pipeline()
    
    mail_input = {
        'server': 'mail.praxis.de',
        'username': 'info@praxis.de',
        'password': 'secret'
    }
    
    print(f"Pipeline-Modus: {mail_processor.pipeline_mode}")
    print(f"Anzahl Nano-Agenten: {len(mail_processor.nano_agents)}")
    print(f"Input: {mail_input}")
    
    result = await mail_processor.execute(mail_input)
    
    if result['success']:
        print("✓ Pipeline erfolgreich!")
        print(f"Verarbeitete E-Mails: {result['nano_results'][1]['result']['emails']}")
        print(f"Klassifizierungen: {result['nano_results'][3]['result']['classifications']}")
        print(f"Gespeicherte Records: {result['final_output']['records_saved']}")
    else:
        print(f"✗ Fehler: {result['error']}")
    
    # 2. Dokument-Analyse (Parallel)
    print("\n\n--- DOCUMENT ANALYZER ---")
    doc_analyzer = create_document_analyzer()
    
    doc_input = {
        'document': {
            'id': 'doc_123',
            'name': 'Patientenakte_Mustermann.pdf',
            'type': 'medical_record'
        }
    }
    
    print(f"Pipeline-Modus: {doc_analyzer.pipeline_mode}")
    print(f"Anzahl parallele Analysen: {len(doc_analyzer.nano_agents)}")
    print(f"Input: {doc_input}")
    
    import time
    start_time = time.time()
    result = await doc_analyzer.execute(doc_input)
    elapsed = time.time() - start_time
    
    if result['success']:
        print(f"✓ Alle Analysen erfolgreich in {elapsed:.2f}s!")
        for nano_result in result['nano_results']:
            agent_name = nano_result['agent_name']
            if nano_result['success']:
                print(f"  • {agent_name}: ✓")
            else:
                print(f"  • {agent_name}: ✗")
    
    # 3. Termin-Buchung (Sequential mit Logik)
    print("\n\n--- APPOINTMENT BOOKER ---")
    appointment_booker = create_appointment_booker()
    
    # Test 1: Zeit verfügbar
    booking_input1 = {
        'date': '2024-02-15',
        'time': '14:00',
        'patient_name': 'Max Mustermann',
        'patient_email': 'max@example.com'
    }
    
    print(f"Test 1 - Verfügbare Zeit: {booking_input1}")
    result1 = await appointment_booker.execute(booking_input1)
    
    if result1['success']:
        final_appointment = result1['nano_results'][2]['result']
        print(f"✓ Termin gebucht: {final_appointment['date']} um {final_appointment['time']}")
        print(f"  Appointment ID: {final_appointment['appointment_id']}")
    
    # Test 2: Zeit nicht verfügbar
    booking_input2 = {
        'date': '2024-02-15',
        'time': '10:00',  # Konflikt!
        'patient_name': 'Erika Musterfrau',
        'patient_email': 'erika@example.com'
    }
    
    print(f"\nTest 2 - Konflikt-Zeit: {booking_input2}")
    result2 = await appointment_booker.execute(booking_input2)
    
    if result2['success']:
        availability = result2['nano_results'][0]['result']
        alternatives = result2['nano_results'][1]['result']
        final_appointment = result2['nano_results'][2]['result']
        
        print(f"✓ Konflikt erkannt! Alternative gebucht.")
        print(f"  Original nicht verfügbar: {availability['conflicts']}")
        print(f"  Alternativen: {alternatives['suggested_slots']}")
        print(f"  Finaler Termin: {final_appointment['date']} um {final_appointment['time']}")


if __name__ == "__main__":
    # Führe Demo aus
    asyncio.run(demo_mikro_agents())