# GermanCodeZero-Agent 🚀

Ein leistungsstarker Agent-Builder für die Erstellung hierarchischer AI-Agenten mit lokalen LLM-Modellen auf Windows 11.

## 🎯 Übersicht

GermanCodeZero-Agent ist ein modulares System zum Erstellen von AI-Agenten in 5 Hierarchiestufen:

### 📊 Agent-Hierarchie

1. **Nano-Agent** 🔹
   - Kleinste Einheit
   - Führt genau EINEN Befehl aus
   - Keine Intelligenz, nur Ausführung

2. **Mikro-Agent** 🔸
   - Kombiniert mehrere Nano-Agenten
   - Erledigt kleine Arbeitsblöcke
   - Einfache Sequenzen ohne Logik

3. **Sub-Agent** 🔶
   - Nutzt mehrere Mikro-Agenten
   - Hat Entscheidungslogik ("wenn-dann")
   - Verwaltet Teilprozesse

4. **Domain-Agent** 🟠
   - Fasst Sub-Agenten zusammen
   - Deckt komplette Fachbereiche ab
   - Branchenspezifische Implementierung

5. **Enterprise-Agent** 🔴
   - Höchste Ebene
   - Steuert Domain-Agenten
   - Komplette Unternehmenslösung

## 🛠️ Technologie-Stack

- **LLM-Backend**: Ollama (lokal)
- **Schwere Modelle**: Windows 11 nativ mit DirectML/Vulkan
- **Leichte Modelle**: Docker Container
- **Programmiersprache**: Python 3.11+
- **Framework**: FastAPI für Web-Interface
- **CLI**: Click für Kommandozeile

## 🚀 Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/GermanCodeZero-Agent.git
cd GermanCodeZero-Agent

# Virtuelle Umgebung erstellen
python -m venv venv
venv\Scripts\activate  # Windows

# Abhängigkeiten installieren
pip install -r requirements.txt

# Ollama installieren (Windows)
# Download von https://ollama.ai
```

## 📖 Schnellstart

```python
from germancodezero import AgentBuilder

# Agent-Builder initialisieren
builder = AgentBuilder()

# Nano-Agent erstellen
nano = builder.create_nano_agent(
    name="email_fetcher",
    action="fetch_imap_mail",
    params={"server": "mail.example.com"}
)

# Mikro-Agent aus Nano-Agenten
mikro = builder.create_mikro_agent(
    name="mail_processor",
    nano_agents=[nano1, nano2, nano3]
)
```

## 🏗️ Architektur

```
GermanCodeZero-Agent/
├── core/               # Kern-System
├── agents/             # Agent-Implementierungen
│   ├── nano/          # Nano-Agent Bausteine
│   ├── mikro/         # Mikro-Agent Module
│   ├── sub/           # Sub-Agent Prozesse
│   ├── domain/        # Domain-Agent Bereiche
│   └── enterprise/    # Enterprise Lösungen
├── templates/         # Agent-Vorlagen
├── configs/           # Konfigurationen
├── models/            # LLM-Model Configs
└── interfaces/        # CLI & Web UI
```

## 💡 Verwendung

Siehe [Dokumentation](docs/) für detaillierte Anleitungen.

## 📄 Lizenz

MIT License - siehe LICENSE Datei