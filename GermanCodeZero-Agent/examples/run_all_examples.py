#!/usr/bin/env python3
"""
GermanCodeZero-Agent - Alle Beispiele ausführen
Demonstriert die komplette 5-Stufen-Hierarchie
"""

import asyncio
import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Import all example modules
from nano_examples import demo_nano_agents
from mikro_examples import demo_mikro_agents
from sub_examples import demo_sub_agents
from domain_examples import demo_domain_agents
from enterprise_examples import demo_enterprise_agent

console = Console()


async def run_all_demos():
    """Führe alle Demos der Reihe nach aus"""
    
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent[/bold blue]\n"
        "[yellow]Demonstration aller 5 Hierarchiestufen[/yellow]",
        border_style="blue"
    ))
    
    console.print("""
Die 5 Stufen der Agent-Hierarchie:

[bold cyan]1. NANO-AGENT[/bold cyan] 🔹
   Die kleinste Einheit - führt genau EINE Aktion aus
   
[bold cyan]2. MIKRO-AGENT[/bold cyan] 🔸
   Kombiniert mehrere Nano-Agenten zu funktionalen Modulen
   
[bold cyan]3. SUB-AGENT[/bold cyan] 🔶
   Verwaltet Teilprozesse mit Entscheidungslogik
   
[bold cyan]4. DOMAIN-AGENT[/bold cyan] 🟠
   Deckt komplette Fachbereiche ab
   
[bold cyan]5. ENTERPRISE-AGENT[/bold cyan] 🔴
   Vollständige Unternehmenslösung
""")
    
    # Frage welche Demos ausgeführt werden sollen
    console.print("\n[cyan]Welche Demos möchtest du sehen?[/cyan]")
    console.print("1. Alle Demos nacheinander")
    console.print("2. Nur bestimmte Stufen")
    console.print("3. Direkt zum Enterprise-Agent (Stufe 5)")
    
    choice = Prompt.ask("Deine Wahl", choices=["1", "2", "3"], default="1")
    
    if choice == "1":
        # Alle Demos
        demos = [
            ("NANO-AGENTEN (Stufe 1)", demo_nano_agents),
            ("MIKRO-AGENTEN (Stufe 2)", demo_mikro_agents),
            ("SUB-AGENTEN (Stufe 3)", demo_sub_agents),
            ("DOMAIN-AGENTEN (Stufe 4)", demo_domain_agents),
            ("ENTERPRISE-AGENT (Stufe 5)", demo_enterprise_agent)
        ]
        
        for title, demo_func in demos:
            console.print(f"\n{'='*60}")
            console.print(f"[bold green]{title}[/bold green]")
            console.print(f"{'='*60}\n")
            
            await demo_func()
            
            if demo_func != demos[-1][1]:  # Nicht nach letzter Demo
                console.print("\n[dim]Drücke Enter für die nächste Demo...[/dim]")
                input()
                
    elif choice == "2":
        # Spezifische Stufen
        console.print("\n[cyan]Welche Stufen möchtest du sehen? (Komma-getrennt)[/cyan]")
        console.print("Beispiel: 1,3,5")
        
        stufen = Prompt.ask("Stufen")
        stufen_list = [int(s.strip()) for s in stufen.split(",")]
        
        demo_map = {
            1: ("NANO-AGENTEN", demo_nano_agents),
            2: ("MIKRO-AGENTEN", demo_mikro_agents),
            3: ("SUB-AGENTEN", demo_sub_agents),
            4: ("DOMAIN-AGENTEN", demo_domain_agents),
            5: ("ENTERPRISE-AGENT", demo_enterprise_agent)
        }
        
        for stufe in stufen_list:
            if stufe in demo_map:
                title, demo_func = demo_map[stufe]
                console.print(f"\n{'='*60}")
                console.print(f"[bold green]{title} (Stufe {stufe})[/bold green]")
                console.print(f"{'='*60}\n")
                
                await demo_func()
                
                if stufe != stufen_list[-1]:
                    console.print("\n[dim]Drücke Enter für die nächste Demo...[/dim]")
                    input()
                    
    elif choice == "3":
        # Direkt Enterprise
        console.print(f"\n{'='*60}")
        console.print(f"[bold green]ENTERPRISE-AGENT (Stufe 5)[/bold green]")
        console.print(f"{'='*60}\n")
        
        await demo_enterprise_agent()
    
    # Zusammenfassung
    console.print("\n" + "="*60)
    console.print(Panel.fit(
        "[bold green]Demo abgeschlossen![/bold green]\n\n"
        "Du hast die hierarchische Struktur des GermanCodeZero-Agent Systems gesehen.\n\n"
        "[yellow]Nächste Schritte:[/yellow]\n"
        "• Erstelle eigene Agenten mit: [cyan]python main.py cli create[/cyan]\n"
        "• Starte das Web-Interface: [cyan]python main.py web[/cyan]\n"
        "• Siehe die Dokumentation: [cyan]python main.py cli templates[/cyan]",
        border_style="green"
    ))


def print_architecture_overview():
    """Zeige Architektur-Übersicht"""
    console.print("""
[bold cyan]ARCHITEKTUR-ÜBERSICHT[/bold cyan]

```
┌─────────────────────────────────────────────────────────┐
│                  ENTERPRISE-AGENT                        │
│  Vollständige Unternehmenslösung mit Policies          │
│  Beispiel: Komplette Praxisverwaltung                  │
└────────────────────┬───────────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────┬────────────┐
        ▼                         ▼             ▼            ▼
┌──────────────┐       ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ DOMAIN-AGENT │       │ DOMAIN-AGENT │  │  DOMAIN  │  │  DOMAIN  │
│   MailOps    │       │ CalendarOps  │  │ Billing  │  │Compliance│
└──────┬───────┘       └──────┬───────┘  └────┬─────┘  └────┬─────┘
       │                      │                │              │
   ┌───┴───┬───┐         ┌───┴───┐        ┌──┴──┐       ┌──┴──┐
   ▼       ▼   ▼         ▼       ▼        ▼     ▼       ▼     ▼
┌─────┐ ┌─────┐      ┌─────┐ ┌─────┐  ┌─────┐      ┌─────┐
│ SUB │ │ SUB │      │ SUB │ │ SUB │  │ SUB │      │ SUB │
└──┬──┘ └──┬──┘      └──┬──┘ └──┬──┘  └──┬──┘      └──┬──┘
   │       │            │       │         │            │
┌──┴──┐ ┌─┴──┐      ┌──┴──┐ ┌─┴──┐   ┌─┴──┐      ┌─┴──┐
│MIKRO│ │MIKRO│      │MIKRO│ │MIKRO│   │MIKRO│      │MIKRO│
└──┬──┘ └──┬──┘      └──┬──┘ └──┬──┘   └──┬──┘      └──┬──┘
   │       │            │       │         │            │
┌──┴─┬─┬─┬─┴──┐     ┌──┴─┬─┬─┬─┴──┐  ┌─┴─┬─┬──┐  ┌─┴─┬──┐
│NANO│ │ │NANO│     │NANO│ │ │NANO│  │NANO│ │  │  │NANO│ │
└────┘ │ └────┘     └────┘ │ └────┘  └────┘ │  │  └────┘ │
       │                   │                 │  │         │
     NANO                NANO              NANO│       NANO
                                              NANO
```

[yellow]Datenfluss:[/yellow] Bottom-Up Ausführung, Top-Down Orchestrierung
[yellow]Kommunikation:[/yellow] Async/Await mit Event-basierter Architektur
[yellow]Skalierung:[/yellow] Horizontal auf jeder Ebene möglich
""")


if __name__ == "__main__":
    # ASCII Art Banner
    banner = """
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗ ███████╗██████╗ ███╗   ███╗ █████╗ ███╗   ██╗         ║
║  ██╔════╝ ██╔════╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║         ║
║  ██║  ███╗█████╗  ██████╔╝██╔████╔██║███████║██╔██╗ ██║         ║
║  ██║   ██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██║╚██╗██║         ║
║  ╚██████╔╝███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║         ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝         ║
║                                                                   ║
║           CODEZERO - BEISPIEL DEMONSTRATION                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
"""
    
    console.print(banner, style="bold blue")
    
    # Zeige Architektur wenn gewünscht
    show_arch = Prompt.ask(
        "\n[cyan]Möchtest du zuerst die Architektur-Übersicht sehen?[/cyan]",
        choices=["j", "n"],
        default="n"
    )
    
    if show_arch.lower() == "j":
        print_architecture_overview()
        console.print("\n[dim]Drücke Enter um mit den Demos fortzufahren...[/dim]")
        input()
    
    # Führe Demos aus
    try:
        asyncio.run(run_all_demos())
    except KeyboardInterrupt:
        console.print("\n[yellow]Demo abgebrochen.[/yellow]")
    except Exception as e:
        console.print(f"\n[red]Fehler: {e}[/red]")
        console.print_exception()