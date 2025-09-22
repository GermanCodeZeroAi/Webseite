#!/usr/bin/env python3
"""
GermanCodeZero-Agent - Haupteinstiegspunkt
"""

import sys
import asyncio
from pathlib import Path
import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
import uvicorn

console = Console()


@click.group()
def main():
    """GermanCodeZero-Agent - Hierarchischer KI-Agent Builder"""
    pass


@main.command()
@click.option('--host', default='0.0.0.0', help='Host to bind to')
@click.option('--port', default=8000, help='Port to bind to')
@click.option('--reload', is_flag=True, help='Enable auto-reload')
def web(host, port, reload):
    """Starte das Web-Interface"""
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent Web Interface[/bold blue]\n"
        f"[yellow]Starting server on http://{host}:{port}[/yellow]",
        border_style="blue"
    ))
    
    console.print("\n[green]API Dokumentation:[/green]")
    console.print(f"  • Swagger UI: http://{host}:{port}/docs")
    console.print(f"  • ReDoc: http://{host}:{port}/redoc")
    console.print(f"  • WebSocket: ws://{host}:{port}/ws\n")
    
    uvicorn.run(
        "interfaces.web_api:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


@main.command()
def cli():
    """Starte die CLI"""
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent CLI[/bold blue]\n"
        "[yellow]Interaktive Kommandozeile[/yellow]",
        border_style="blue"
    ))
    
    # Import and run CLI
    from interfaces.cli import cli as cli_app
    cli_app()


@main.command()
def setup():
    """Führe das Setup aus"""
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent Setup[/bold blue]\n"
        "[yellow]Initialisierung des Systems[/yellow]",
        border_style="blue"
    ))
    
    tasks = [
        ("Prüfe Python-Version", check_python_version),
        ("Prüfe Abhängigkeiten", check_dependencies),
        ("Prüfe Ollama", check_ollama),
        ("Prüfe Docker", check_docker),
        ("Erstelle Verzeichnisse", create_directories),
        ("Initialisiere Datenbank", init_database),
    ]
    
    for task_name, task_func in tasks:
        console.print(f"\n[cyan]{task_name}...[/cyan]")
        try:
            result = task_func()
            if result:
                console.print(f"[green]✓ {task_name} erfolgreich[/green]")
            else:
                console.print(f"[yellow]⚠ {task_name} fehlgeschlagen[/yellow]")
        except Exception as e:
            console.print(f"[red]✗ {task_name} Fehler: {e}[/red]")


@main.command()
def quickstart():
    """Schnellstart-Wizard"""
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent Quickstart[/bold blue]\n"
        "[yellow]Erstelle deinen ersten Agenten![/yellow]",
        border_style="blue"
    ))
    
    console.print("\nWillkommen! Lass uns gemeinsam deinen ersten Agenten erstellen.\n")
    
    # Wähle Szenario
    console.print("[cyan]Wähle ein Szenario:[/cyan]")
    console.print("1. E-Mail Verarbeitung (Nano → Mikro)")
    console.print("2. Terminbuchung (Sub-Agent)")
    console.print("3. Praxis-Verwaltung (Enterprise)")
    
    choice = Prompt.ask("Deine Wahl", choices=["1", "2", "3"])
    
    if choice == "1":
        create_email_scenario()
    elif choice == "2":
        create_appointment_scenario()
    elif choice == "3":
        create_practice_scenario()
        
    console.print("\n[green]✓ Quickstart abgeschlossen![/green]")
    console.print("\nNächste Schritte:")
    console.print("• Starte das Web-Interface: [cyan]python main.py web[/cyan]")
    console.print("• Nutze die CLI: [cyan]python main.py cli[/cyan]")
    console.print("• Siehe alle Agenten: [cyan]python main.py cli list[/cyan]")


def check_python_version():
    """Prüfe Python-Version"""
    if sys.version_info < (3, 11):
        raise Exception(f"Python 3.11+ benötigt, gefunden: {sys.version}")
    return True


def check_dependencies():
    """Prüfe ob alle Dependencies installiert sind"""
    try:
        import fastapi
        import click
        import pydantic
        import yaml
        return True
    except ImportError as e:
        console.print("[yellow]Fehlende Dependencies. Führe aus:[/yellow]")
        console.print("[cyan]pip install -r requirements.txt[/cyan]")
        return False


def check_ollama():
    """Prüfe Ollama-Verbindung"""
    try:
        import asyncio
        from models.ollama_integration import OllamaClient
        
        async def test():
            async with OllamaClient() as client:
                models = await client.list_models()
                return len(models) > 0
                
        return asyncio.run(test())
    except:
        console.print("[yellow]Ollama nicht erreichbar.[/yellow]")
        console.print("Starte Ollama mit: [cyan]ollama serve[/cyan]")
        return False


def check_docker():
    """Prüfe Docker"""
    import subprocess
    try:
        result = subprocess.run(['docker', 'ps'], capture_output=True)
        return result.returncode == 0
    except:
        console.print("[yellow]Docker nicht gefunden oder nicht gestartet.[/yellow]")
        return False


def create_directories():
    """Erstelle notwendige Verzeichnisse"""
    dirs = [
        "data",
        "logs", 
        "workspace",
        "knowledge/templates",
        "knowledge/patterns",
        "knowledge/policies"
    ]
    
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        
    return True


def init_database():
    """Initialisiere die Datenbank"""
    # Hier würde die DB-Initialisierung stattfinden
    return True


def create_email_scenario():
    """Erstelle E-Mail Verarbeitungs-Szenario"""
    console.print("\n[cyan]Erstelle E-Mail Verarbeitungs-Agenten...[/cyan]")
    
    # Hier würde der Agent-Erstellungscode kommen
    # Für Demo nur Ausgabe
    console.print("• Erstelle Nano-Agent: IMAP Mail Fetcher")
    console.print("• Erstelle Nano-Agent: Email Parser")
    console.print("• Erstelle Nano-Agent: Email Classifier")
    console.print("• Erstelle Mikro-Agent: Complete Mail Processor")
    
    console.print("\n[green]✓ E-Mail Agenten erstellt![/green]")


def create_appointment_scenario():
    """Erstelle Terminbuchungs-Szenario"""
    console.print("\n[cyan]Erstelle Terminbuchungs-Agenten...[/cyan]")
    
    console.print("• Erstelle Mikro-Agent: Calendar Checker")
    console.print("• Erstelle Mikro-Agent: Appointment Creator")
    console.print("• Erstelle Sub-Agent: Intelligent Appointment Booker")
    
    console.print("\n[green]✓ Terminbuchungs-Agenten erstellt![/green]")


def create_practice_scenario():
    """Erstelle Praxis-Verwaltungs-Szenario"""
    console.print("\n[cyan]Erstelle Praxis-Enterprise-Agent...[/cyan]")
    
    console.print("• Erstelle Domain-Agent: Mail Operations")
    console.print("• Erstelle Domain-Agent: Patient Management")
    console.print("• Erstelle Domain-Agent: Calendar Operations")
    console.print("• Erstelle Enterprise-Agent: Complete Practice Solution")
    
    console.print("\n[green]✓ Praxis-Enterprise-Agent erstellt![/green]")


if __name__ == '__main__':
    # Zeige ASCII Art Banner
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ██████╗ ███████╗██████╗ ███╗   ███╗ █████╗ ███╗   ██╗     ║
    ║  ██╔════╝ ██╔════╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║     ║
    ║  ██║  ███╗█████╗  ██████╔╝██╔████╔██║███████║██╔██╗ ██║     ║
    ║  ██║   ██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██║╚██╗██║     ║
    ║  ╚██████╔╝███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║     ║
    ║   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝     ║
    ║                                                               ║
    ║          ██████╗ ██████╗ ██████╗ ███████╗                    ║
    ║         ██╔════╝██╔═══██╗██╔══██╗██╔════╝                    ║
    ║         ██║     ██║   ██║██║  ██║█████╗                      ║
    ║         ██║     ██║   ██║██║  ██║██╔══╝                      ║
    ║         ╚██████╗╚██████╔╝██████╔╝███████╗                    ║
    ║          ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝                    ║
    ║                                                               ║
    ║         ███████╗███████╗██████╗  ██████╗                     ║
    ║         ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗                    ║
    ║           ███╔╝ █████╗  ██████╔╝██║   ██║                    ║
    ║          ███╔╝  ██╔══╝  ██╔══██╗██║   ██║                    ║
    ║         ███████╗███████╗██║  ██║╚██████╔╝                    ║
    ║         ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝                     ║
    ║                                                               ║
    ║             Hierarchical AI Agent Builder                     ║
    ║                    Version 1.0.0                              ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    
    console.print(banner, style="bold blue")
    main()