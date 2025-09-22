#!/usr/bin/env python3
"""
Setup-Skript für GermanCodeZero-Agent Models
Lädt alle benötigten Modelle für Windows 11
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import platform

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from models.ollama_integration import OllamaClient, setup_ollama_for_windows
from configs.windows_config import WindowsEnvironmentConfig, ModelOptimizer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from rich.panel import Panel


console = Console()


async def check_ollama_connection(client: OllamaClient) -> bool:
    """Prüfe Ollama-Verbindung"""
    try:
        models = await client.list_models()
        return True
    except Exception as e:
        console.print(f"[red]❌ Ollama-Verbindung fehlgeschlagen: {e}[/red]")
        return False


async def pull_model_with_progress(client: OllamaClient, model_name: str, progress: Progress):
    """Lade ein Modell mit Progress-Anzeige"""
    task = progress.add_task(f"[cyan]Lade {model_name}...", total=100)
    
    try:
        # Starte Pull in separatem Task
        pull_task = asyncio.create_task(client.pull_model(model_name))
        
        # Simuliere Progress (in Produktion würde man echten Progress tracken)
        for i in range(100):
            progress.update(task, advance=1)
            await asyncio.sleep(0.1)
            
        await pull_task
        progress.update(task, completed=100)
        console.print(f"[green]✓ {model_name} erfolgreich geladen[/green]")
        return True
        
    except Exception as e:
        console.print(f"[red]✗ Fehler beim Laden von {model_name}: {e}[/red]")
        return False
    finally:
        progress.remove_task(task)


async def setup_models():
    """Hauptfunktion zum Setup der Modelle"""
    console.print(Panel.fit("[bold blue]GermanCodeZero-Agent Model Setup[/bold blue]"))
    
    # System-Check
    console.print("\n[yellow]System-Analyse...[/yellow]")
    config = WindowsEnvironmentConfig()
    optimizer = ModelOptimizer(config)
    
    # Zeige System-Info
    system_info = config.get_system_info()
    
    table = Table(title="System Information")
    table.add_column("Eigenschaft", style="cyan")
    table.add_column("Wert", style="green")
    
    table.add_row("Betriebssystem", f"{system_info['os']} {system_info['os_version']}")
    table.add_row("Architektur", system_info['architecture'])
    table.add_row("CPU Kerne", str(system_info['cpu_count']))
    table.add_row("RAM", f"{system_info['memory']['total'] / (1024**3):.1f} GB")
    table.add_row("DirectML", "✓" if config.directml_available else "✗")
    table.add_row("Vulkan", "✓" if config.vulkan_available else "✗")
    
    if 'gpu' in system_info and system_info['gpu']:
        table.add_row("GPU", system_info['gpu'].get('name', 'Unbekannt'))
        
    console.print(table)
    
    # Ollama-Verbindung prüfen
    console.print("\n[yellow]Prüfe Ollama-Verbindung...[/yellow]")
    
    async with OllamaClient() as client:
        if not await check_ollama_connection(client):
            console.print("\n[red]Bitte stelle sicher, dass Ollama läuft![/red]")
            console.print("Starte Ollama mit: [cyan]ollama serve[/cyan]")
            return
            
        console.print("[green]✓ Ollama-Verbindung erfolgreich[/green]")
        
        # Liste vorhandene Modelle
        existing_models = await client.list_models()
        existing_names = [m['name'] for m in existing_models]
        
        if existing_models:
            console.print("\n[cyan]Bereits installierte Modelle:[/cyan]")
            for model in existing_models:
                size_gb = model.get('size', 0) / (1024**3)
                console.print(f"  • {model['name']} ({size_gb:.1f} GB)")
                
        # Bestimme zu installierende Modelle
        recommended_models = []
        
        # Schwere Modelle (nur mit GPU)
        if config.directml_available:
            recommended_models.extend([
                ('llama3:70b-instruct-q4_K_M', 'Reasoning & Analyse', 'GPU'),
                ('mixtral:8x7b-instruct-q4_K_M', 'Vielseitige Aufgaben', 'GPU'),
            ])
            
        # Mittlere Modelle
        recommended_models.extend([
            ('deepseek-coder:33b-instruct-q4_K_M', 'Code-Generierung', 'GPU/CPU'),
            ('codellama:13b-instruct-q4_K_M', 'Code-Completion', 'GPU/CPU'),
        ])
        
        # Leichte Modelle (für Docker)
        recommended_models.extend([
            ('mistral:7b-instruct-q4_K_M', 'Allgemeine Aufgaben', 'Docker'),
            ('phi-2', 'Schnelle Antworten', 'Docker'),
            ('nomic-embed-text', 'Text-Embeddings', 'Docker'),
        ])
        
        # Zeige Empfehlungen
        console.print("\n[cyan]Empfohlene Modelle für dein System:[/cyan]")
        
        models_table = Table(title="Model-Empfehlungen")
        models_table.add_column("Modell", style="cyan")
        models_table.add_column("Verwendung", style="yellow")
        models_table.add_column("Ausführung", style="green")
        models_table.add_column("Status", style="white")
        
        to_download = []
        for model_name, usage, location in recommended_models:
            status = "✓ Installiert" if model_name in existing_names else "⚡ Ausstehend"
            models_table.add_row(model_name, usage, location, status)
            
            if model_name not in existing_names:
                to_download.append(model_name)
                
        console.print(models_table)
        
        # Frage ob Installation gewünscht
        if to_download:
            console.print(f"\n[yellow]{len(to_download)} Modelle müssen heruntergeladen werden.[/yellow]")
            
            # Schätze Download-Größe
            total_size_gb = len(to_download) * 15  # Grobe Schätzung
            console.print(f"Geschätzter Download: ~{total_size_gb} GB")
            
            response = console.input("\n[cyan]Möchtest du die fehlenden Modelle jetzt installieren? (j/n): [/cyan]")
            
            if response.lower() in ['j', 'ja', 'y', 'yes']:
                console.print("\n[green]Starte Download der Modelle...[/green]")
                
                with Progress(
                    SpinnerColumn(),
                    TextColumn("[progress.description]{task.description}"),
                    BarColumn(),
                    console=console
                ) as progress:
                    
                    for model in to_download:
                        success = await pull_model_with_progress(client, model, progress)
                        if not success:
                            console.print(f"[red]Installation von {model} fehlgeschlagen[/red]")
                            
        else:
            console.print("\n[green]✓ Alle empfohlenen Modelle sind bereits installiert![/green]")
            
        # Windows-spezifisches Setup
        if platform.system() == "Windows":
            console.print("\n[yellow]Führe Windows-spezifisches Setup durch...[/yellow]")
            success = await setup_ollama_for_windows(client)
            if success:
                console.print("[green]✓ Windows-Setup erfolgreich[/green]")
            else:
                console.print("[red]✗ Windows-Setup fehlgeschlagen[/red]")
                
        # Abschluss
        console.print("\n[bold green]Setup abgeschlossen![/bold green]")
        console.print("\nNächste Schritte:")
        console.print("1. Starte Docker-Container: [cyan]docker-compose up -d[/cyan]")
        console.print("2. Initialisiere die Datenbank: [cyan]python init_db.py[/cyan]")
        console.print("3. Starte den Agent-Builder: [cyan]python main.py[/cyan]")


async def test_model_performance():
    """Teste die Performance der installierten Modelle"""
    console.print("\n[yellow]Teste Model-Performance...[/yellow]")
    
    test_prompt = "Erkläre in einem Satz was ein Nano-Agent ist."
    
    async with OllamaClient() as client:
        models = await client.list_models()
        
        results_table = Table(title="Performance-Test")
        results_table.add_column("Modell", style="cyan")
        results_table.add_column("Zeit (s)", style="yellow")
        results_table.add_column("Tokens/s", style="green")
        
        for model in models[:3]:  # Teste nur die ersten 3 Modelle
            model_name = model['name']
            console.print(f"\nTeste {model_name}...")
            
            import time
            start = time.time()
            
            response = await client.generate(
                prompt=test_prompt,
                model=model_name,
                max_tokens=50
            )
            
            elapsed = time.time() - start
            tokens = len(response.split())
            tokens_per_sec = tokens / elapsed if elapsed > 0 else 0
            
            results_table.add_row(
                model_name,
                f"{elapsed:.2f}",
                f"{tokens_per_sec:.1f}"
            )
            
        console.print(results_table)


if __name__ == "__main__":
    # Prüfe Python-Version
    if sys.version_info < (3, 11):
        console.print("[red]Python 3.11+ wird benötigt![/red]")
        sys.exit(1)
        
    try:
        asyncio.run(setup_models())
        
        # Optional: Performance-Test
        response = console.input("\n[cyan]Möchtest du einen Performance-Test durchführen? (j/n): [/cyan]")
        if response.lower() in ['j', 'ja', 'y', 'yes']:
            asyncio.run(test_model_performance())
            
    except KeyboardInterrupt:
        console.print("\n[yellow]Setup abgebrochen.[/yellow]")
    except Exception as e:
        console.print(f"\n[red]Fehler: {e}[/red]")
        sys.exit(1)