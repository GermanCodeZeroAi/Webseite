"""
Beispiel Nano-Agenten - Stufe 1
Die kleinsten Einheiten, die genau EINE Aktion ausführen
"""

import asyncio
from typing import Dict, Any
import aiohttp
import json
from datetime import datetime

# Add parent directory to path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.nano_agent import NanoAgent


# ============= BEISPIEL 1: E-Mail IMAP Abruf =============
async def fetch_imap_emails(**kwargs) -> Dict[str, Any]:
    """
    Hole E-Mails via IMAP
    Simuliert für Demo - in Produktion würde echte IMAP-Verbindung verwendet
    """
    server = kwargs.get('server', 'mail.example.com')
    username = kwargs.get('username', 'user@example.com')
    folder = kwargs.get('folder', 'INBOX')
    limit = kwargs.get('limit', 10)
    
    # Simuliere E-Mail-Abruf
    emails = []
    for i in range(min(limit, 5)):
        emails.append({
            'id': f'msg_{i+1}',
            'subject': f'Demo E-Mail {i+1}',
            'from': f'sender{i+1}@example.com',
            'date': datetime.now().isoformat(),
            'body': f'Dies ist der Inhalt von E-Mail {i+1}',
            'unread': i < 2
        })
    
    return {
        'server': server,
        'folder': folder,
        'email_count': len(emails),
        'emails': emails
    }


# ============= BEISPIEL 2: Datenbank Schreib-Operation =============
async def write_to_database(**kwargs) -> Dict[str, Any]:
    """
    Schreibe Daten in eine Datenbank
    Simuliert für Demo
    """
    table = kwargs.get('table_name', 'default_table')
    data = kwargs.get('data', {})
    
    # Simuliere DB-Write
    record_id = f"rec_{datetime.now().timestamp()}"
    
    return {
        'success': True,
        'table': table,
        'record_id': record_id,
        'timestamp': datetime.now().isoformat(),
        'fields_written': list(data.keys()) if isinstance(data, dict) else ['data']
    }


# ============= BEISPIEL 3: OCR auf PDF =============
async def perform_ocr(**kwargs) -> Dict[str, Any]:
    """
    Führe OCR auf einem Dokument aus
    Simuliert für Demo
    """
    file_path = kwargs.get('file_path', 'document.pdf')
    language = kwargs.get('language', 'de')
    
    # Simuliere OCR-Ergebnis
    extracted_text = f"""
    RECHNUNG Nr. 2024-001
    
    Datum: {datetime.now().strftime('%d.%m.%Y')}
    
    Empfänger:
    Max Mustermann
    Musterstraße 123
    12345 Musterstadt
    
    Leistung: Beratung
    Betrag: 250,00 €
    
    MwSt (19%): 47,50 €
    Gesamt: 297,50 €
    """
    
    return {
        'file': file_path,
        'language': language,
        'text': extracted_text,
        'confidence': 0.95,
        'pages_processed': 1
    }


# ============= BEISPIEL 4: API Call =============
async def call_external_api(**kwargs) -> Dict[str, Any]:
    """
    Mache einen externen API-Call
    """
    endpoint = kwargs.get('endpoint', 'https://api.example.com/data')
    method = kwargs.get('method', 'GET')
    headers = kwargs.get('headers', {})
    data = kwargs.get('data', {})
    
    # Simuliere API Response
    # In Produktion würde hier aiohttp verwendet
    
    response_data = {
        'status': 'success',
        'data': {
            'id': 123,
            'name': 'API Response',
            'timestamp': datetime.now().isoformat()
        }
    }
    
    return {
        'endpoint': endpoint,
        'method': method,
        'status_code': 200,
        'response': response_data
    }


# ============= BEISPIEL 5: Push-Notification senden =============
async def send_push_notification(**kwargs) -> Dict[str, Any]:
    """
    Sende eine Push-Benachrichtigung
    """
    recipient = kwargs.get('recipient', 'user@example.com')
    title = kwargs.get('title', 'Notification')
    message = kwargs.get('message', 'You have a new message')
    priority = kwargs.get('priority', 'normal')
    
    # Simuliere Notification-Versand
    notification_id = f"notif_{datetime.now().timestamp()}"
    
    return {
        'success': True,
        'notification_id': notification_id,
        'recipient': recipient,
        'sent_at': datetime.now().isoformat(),
        'delivery_status': 'delivered'
    }


# ============= BEISPIEL 6: Risiko-Score berechnen =============
def calculate_risk_score(**kwargs) -> Dict[str, Any]:
    """
    Berechne einen Risiko-Score
    Synchrone Funktion da keine I/O
    """
    factors = kwargs.get('factors', {})
    
    # Einfache Risiko-Berechnung
    base_score = 50
    
    # Faktoren
    if factors.get('payment_history', 'good') == 'poor':
        base_score += 20
    if factors.get('debt_ratio', 0) > 0.5:
        base_score += 15
    if factors.get('account_age_days', 365) < 90:
        base_score += 10
    if factors.get('previous_defaults', 0) > 0:
        base_score += 25
        
    # Normalisiere auf 0-100
    risk_score = min(max(base_score, 0), 100)
    
    # Kategorisiere
    if risk_score < 30:
        category = 'low'
    elif risk_score < 70:
        category = 'medium'
    else:
        category = 'high'
    
    return {
        'risk_score': risk_score,
        'risk_category': category,
        'factors_analyzed': list(factors.keys()),
        'recommendation': 'approve' if risk_score < 50 else 'manual_review'
    }


# ============= Agent-Erstellung =============
def create_example_nano_agents():
    """Erstelle alle Beispiel Nano-Agenten"""
    
    agents = []
    
    # 1. IMAP Mail Fetcher
    mail_fetcher = NanoAgent(
        name="imap_mail_fetcher",
        action=fetch_imap_emails,
        description="Hole E-Mails via IMAP von einem Mail-Server",
        input_schema={
            'required': ['server', 'username'],
            'properties': {
                'server': {'type': 'string'},
                'username': {'type': 'string'},
                'password': {'type': 'string'},
                'folder': {'type': 'string', 'default': 'INBOX'},
                'limit': {'type': 'integer', 'default': 50}
            }
        },
        output_schema={
            'properties': {
                'email_count': {'type': 'integer'},
                'emails': {'type': 'array'}
            }
        }
    )
    agents.append(mail_fetcher)
    
    # 2. Database Writer
    db_writer = NanoAgent(
        name="database_writer",
        action=write_to_database,
        description="Schreibe Daten in eine Datenbank-Tabelle",
        input_schema={
            'required': ['table_name', 'data'],
            'properties': {
                'table_name': {'type': 'string'},
                'data': {'type': 'object'}
            }
        }
    )
    agents.append(db_writer)
    
    # 3. OCR Processor
    ocr_processor = NanoAgent(
        name="ocr_processor",
        action=perform_ocr,
        description="Führe OCR auf einem PDF-Dokument aus",
        input_schema={
            'required': ['file_path'],
            'properties': {
                'file_path': {'type': 'string'},
                'language': {'type': 'string', 'default': 'de'}
            }
        }
    )
    agents.append(ocr_processor)
    
    # 4. API Caller
    api_caller = NanoAgent(
        name="api_caller",
        action=call_external_api,
        description="Mache einen externen API-Call",
        input_schema={
            'required': ['endpoint'],
            'properties': {
                'endpoint': {'type': 'string'},
                'method': {'type': 'string', 'default': 'GET'},
                'headers': {'type': 'object'},
                'data': {'type': 'object'}
            }
        }
    )
    agents.append(api_caller)
    
    # 5. Notification Sender
    notifier = NanoAgent(
        name="push_notifier",
        action=send_push_notification,
        description="Sende eine Push-Benachrichtigung",
        input_schema={
            'required': ['recipient', 'message'],
            'properties': {
                'recipient': {'type': 'string'},
                'title': {'type': 'string'},
                'message': {'type': 'string'},
                'priority': {'type': 'string', 'enum': ['low', 'normal', 'high']}
            }
        }
    )
    agents.append(notifier)
    
    # 6. Risk Calculator
    risk_calc = NanoAgent(
        name="risk_calculator",
        action=calculate_risk_score,
        description="Berechne einen Risiko-Score basierend auf verschiedenen Faktoren",
        input_schema={
            'required': ['factors'],
            'properties': {
                'factors': {
                    'type': 'object',
                    'properties': {
                        'payment_history': {'type': 'string'},
                        'debt_ratio': {'type': 'number'},
                        'account_age_days': {'type': 'integer'},
                        'previous_defaults': {'type': 'integer'}
                    }
                }
            }
        }
    )
    agents.append(risk_calc)
    
    return agents


# ============= Demo-Ausführung =============
async def demo_nano_agents():
    """Demonstriere die Nano-Agenten"""
    print("=== NANO-AGENT DEMO ===\n")
    
    agents = create_example_nano_agents()
    
    # Teste jeden Agent
    test_inputs = [
        # Mail Fetcher
        {
            'server': 'mail.example.com',
            'username': 'demo@example.com',
            'limit': 3
        },
        # DB Writer
        {
            'table_name': 'customers',
            'data': {
                'name': 'Max Mustermann',
                'email': 'max@example.com',
                'created_at': datetime.now().isoformat()
            }
        },
        # OCR
        {
            'file_path': '/documents/invoice_2024.pdf',
            'language': 'de'
        },
        # API Call
        {
            'endpoint': 'https://api.example.com/users/123',
            'method': 'GET'
        },
        # Notification
        {
            'recipient': 'user@example.com',
            'title': 'Termin-Erinnerung',
            'message': 'Ihr Termin morgen um 10:00 Uhr',
            'priority': 'high'
        },
        # Risk Score
        {
            'factors': {
                'payment_history': 'good',
                'debt_ratio': 0.3,
                'account_age_days': 730,
                'previous_defaults': 0
            }
        }
    ]
    
    for agent, test_input in zip(agents, test_inputs):
        print(f"\n--- {agent.metadata.name.upper()} ---")
        print(f"Beschreibung: {agent.metadata.description}")
        print(f"Input: {test_input}")
        
        # Führe Agent aus
        result = await agent.execute(test_input)
        
        if result.get('success'):
            print(f"✓ Erfolgreich!")
            print(f"Output: {json.dumps(result.get('result', {}), indent=2, ensure_ascii=False)}")
        else:
            print(f"✗ Fehler: {result.get('error')}")
            
        print("-" * 50)


if __name__ == "__main__":
    # Führe Demo aus
    asyncio.run(demo_nano_agents())