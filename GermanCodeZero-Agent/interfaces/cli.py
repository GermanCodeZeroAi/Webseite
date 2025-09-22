"""
GermanCodeZero-Agent CLI Interface
"""

import asyncio
import click
import yaml
import json
from pathlib import Path
from typing import Optional, Dict, Any
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax
from rich.prompt import Prompt, Confirm
from rich.progress import Progress, SpinnerColumn, TextColumn
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from core.agent_builder import AgentBuilder
from core.agent_registry import AgentRegistry
from templates.template_registry import get_template_registry
from models.ollama_integration import OllamaClient, AgentLLMIntegration
from configs.windows_config import WindowsEnvironmentConfig, generate_environment_report


console = Console()


@click.group()
@click.option('--debug', is_flag=True, help='Enable debug mode')
@click.pass_context
def cli(ctx, debug):
    """GermanCodeZero-Agent - Intelligenter Agent Builder"""
    ctx.ensure_object(dict)
    ctx.obj['debug'] = debug
    ctx.obj['builder'] = AgentBuilder()
    ctx.obj['registry'] = AgentRegistry()
    ctx.obj['templates'] = get_template_registry()
    
    # Zeige Banner
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent[/bold blue]\n"
        "[yellow]Hierarchischer KI-Agent Builder[/yellow]",
        border_style="blue"
    ))


@cli.command()
@click.pass_context
def info(ctx):
    """Zeige System-Informationen"""
    console.print("\n[bold cyan]System-Information[/bold cyan]\n")
    
    # Windows Config
    config = WindowsEnvironmentConfig()
    system_info = config.get_system_info()
    
    table = Table(title="System Details")
    table.add_column("Eigenschaft", style="cyan", width=20)
    table.add_column("Wert", style="green")
    
    table.add_row("Betriebssystem", f"{system_info['os']} {system_info['os_version']}")
    table.add_row("Architektur", system_info['architecture'])
    table.add_row("CPU Kerne", str(system_info['cpu_count']))
    table.add_row("RAM", f"{system_info['memory']['total'] / (1024**3):.1f} GB")
    table.add_row("DirectML", "✓" if config.directml_available else "✗")
    table.add_row("Vulkan", "✓" if config.vulkan_available else "✗")
    
    console.print(table)
    
    # Agent Stats
    builder_stats = ctx.obj['builder'].get_builder_stats()
    
    stats_table = Table(title="Agent-Statistiken")
    stats_table.add_column("Typ", style="cyan")
    stats_table.add_column("Anzahl", style="yellow")
    
    for agent_type, count in builder_stats['by_type'].items():
        stats_table.add_row(agent_type.title(), str(count))
        
    stats_table.add_row("─────────", "─────", style="dim")
    stats_table.add_row("Gesamt", str(builder_stats['total_agents']), style="bold")
    
    console.print("\n")
    console.print(stats_table)


@cli.command()
@click.argument('agent_type', type=click.Choice(['nano', 'mikro', 'sub', 'domain', 'enterprise']))
@click.option('--template', '-t', help='Template verwenden')
@click.option('--interactive', '-i', is_flag=True, help='Interaktiver Modus')
@click.option('--spec-file', '-f', type=click.Path(exists=True), help='Spec-Datei (YAML/JSON)')
@click.pass_context
def create(ctx, agent_type, template, interactive, spec_file):
    """Erstelle einen neuen Agenten"""
    console.print(f"\n[bold green]Erstelle {agent_type.upper()}-Agent[/bold green]\n")
    
    spec = {}
    
    # Lade Spec aus Datei
    if spec_file:
        with open(spec_file, 'r') as f:
            if spec_file.endswith('.yaml') or spec_file.endswith('.yml'):
                spec = yaml.safe_load(f)
            else:
                spec = json.load(f)
                
    # Template verwenden
    elif template:
        template_registry = ctx.obj['templates']
        template_data = template_registry.get_template(f"{agent_type}/{template}")
        
        if not template_data:
            console.print(f"[red]Template '{template}' nicht gefunden![/red]")
            # Zeige verfügbare Templates
            available = template_registry.get_templates_by_level(agent_type)
            if available:
                console.print("\n[yellow]Verfügbare Templates:[/yellow]")
                for t in available[:5]:
                    console.print(f"  • {t['name']}: {t.get('description', '')}")
            return
            
        spec = template_data.copy()
        
    # Interaktiver Modus
    elif interactive:
        spec = interactive_agent_creation(agent_type)
        
    else:
        console.print("[red]Bitte gib --template, --interactive oder --spec-file an![/red]")
        return
        
    # Zeige Spec
    console.print("\n[cyan]Agent-Spezifikation:[/cyan]")
    syntax = Syntax(yaml.dump(spec, default_flow_style=False), "yaml", theme="monokai")
    console.print(syntax)
    
    # Bestätigung
    if not Confirm.ask("\nAgent erstellen?"):
        console.print("[yellow]Abgebrochen.[/yellow]")
        return
        
    # Erstelle Agent
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task(f"Erstelle {agent_type}-Agent...", total=1)
        
        try:
            # Async execution
            agent = asyncio.run(ctx.obj['builder'].build_agent(spec))
            
            # Registriere Agent
            ctx.obj['registry'].register(agent)
            
            progress.update(task, completed=1)
            
            console.print(f"\n[green]✓ Agent '{agent.metadata.name}' erfolgreich erstellt![/green]")
            console.print(f"  ID: {agent.metadata.id}")
            console.print(f"  Typ: {agent.agent_type.name}")
            
        except Exception as e:
            console.print(f"\n[red]✗ Fehler beim Erstellen: {e}[/red]")
            if ctx.obj['debug']:
                console.print_exception()


@cli.command()
@click.option('--type', '-t', 'agent_type', type=click.Choice(['nano', 'mikro', 'sub', 'domain', 'enterprise']))
@click.option('--search', '-s', help='Suche nach Name')
@click.pass_context
def list(ctx, agent_type, search):
    """Liste alle Agenten"""
    registry = ctx.obj['registry']
    
    if search:
        agents = registry.search(search)
        title = f"Suchergebnisse für '{search}'"
    elif agent_type:
        from core.base_agent import AgentType
        type_enum = AgentType[agent_type.upper()]
        agents = [registry.get(name) for name in registry.list_agents(type_enum)]
        title = f"{agent_type.title()}-Agenten"
    else:
        agents = [registry.get(name) for name in registry.list_agents()]
        title = "Alle Agenten"
        
    if not agents:
        console.print(f"[yellow]Keine Agenten gefunden.[/yellow]")
        return
        
    table = Table(title=title)
    table.add_column("Name", style="cyan")
    table.add_column("Typ", style="green")
    table.add_column("Beschreibung", style="white")
    table.add_column("Erstellt", style="yellow")
    
    for agent in agents:
        if agent:
            table.add_row(
                agent.metadata.name,
                agent.agent_type.name,
                agent.metadata.description[:50] + "..." if len(agent.metadata.description) > 50 else agent.metadata.description,
                agent.metadata.created_at.strftime("%Y-%m-%d %H:%M")
            )
            
    console.print(table)


@cli.command()
@click.argument('agent_name')
@click.pass_context
def show(ctx, agent_name):
    """Zeige Details eines Agenten"""
    registry = ctx.obj['registry']
    agent = registry.get(agent_name)
    
    if not agent:
        console.print(f"[red]Agent '{agent_name}' nicht gefunden![/red]")
        return
        
    # Basis-Infos
    console.print(Panel(
        f"[bold]{agent.metadata.name}[/bold]\n"
        f"[dim]{agent.metadata.description}[/dim]",
        title=f"{agent.agent_type.name} Agent",
        border_style="green"
    ))
    
    # Details
    info = agent.get_info()
    
    details_table = Table(show_header=False)
    details_table.add_column("Eigenschaft", style="cyan")
    details_table.add_column("Wert")
    
    details_table.add_row("ID", info['id'])
    details_table.add_row("Version", info['version'])
    details_table.add_row("Erstellt", info['created_at'])
    details_table.add_row("Status", "[green]Aktiv[/green]" if info['is_running'] else "[red]Inaktiv[/red]")
    
    console.print(details_table)
    
    # Hierarchie
    hierarchy = registry.get_hierarchy(agent_name)
    if hierarchy.get('children'):
        console.print("\n[cyan]Hierarchie:[/cyan]")
        print_hierarchy(hierarchy, 0)


@cli.command()
@click.argument('agent_name')
@click.argument('input_file', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), help='Output-Datei')
@click.pass_context
def run(ctx, agent_name, input_file, output):
    """Führe einen Agenten aus"""
    registry = ctx.obj['registry']
    agent = registry.get(agent_name)
    
    if not agent:
        console.print(f"[red]Agent '{agent_name}' nicht gefunden![/red]")
        return
        
    # Lade Input
    with open(input_file, 'r') as f:
        if input_file.endswith('.yaml') or input_file.endswith('.yml'):
            input_data = yaml.safe_load(f)
        else:
            input_data = json.load(f)
            
    console.print(f"\n[cyan]Führe {agent.agent_type.name}-Agent '{agent_name}' aus...[/cyan]\n")
    
    # Zeige Input
    console.print("[dim]Input:[/dim]")
    syntax = Syntax(yaml.dump(input_data, default_flow_style=False), "yaml", theme="monokai")
    console.print(syntax)
    
    # Führe aus
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Verarbeite...", total=1)
        
        try:
            # Start Agent
            agent.start()
            
            # Execute
            result = asyncio.run(agent.execute(input_data))
            
            # Stop Agent  
            agent.stop()
            
            progress.update(task, completed=1)
            
            # Zeige Ergebnis
            console.print("\n[green]✓ Ausführung erfolgreich![/green]\n")
            console.print("[dim]Output:[/dim]")
            
            output_yaml = yaml.dump(result, default_flow_style=False)
            syntax = Syntax(output_yaml, "yaml", theme="monokai")
            console.print(syntax)
            
            # Speichere Output
            if output:
                with open(output, 'w') as f:
                    if output.endswith('.yaml') or output.endswith('.yml'):
                        yaml.dump(result, f)
                    else:
                        json.dump(result, f, indent=2)
                console.print(f"\n[green]Output gespeichert in: {output}[/green]")
                
        except Exception as e:
            console.print(f"\n[red]✗ Fehler bei Ausführung: {e}[/red]")
            if ctx.obj['debug']:
                console.print_exception()


@cli.command()
@click.pass_context  
def templates(ctx):
    """Zeige verfügbare Templates"""
    template_registry = ctx.obj['templates']
    stats = template_registry.get_statistics()
    
    console.print("\n[bold cyan]Template-Übersicht[/bold cyan]\n")
    
    # Statistiken
    stats_table = Table(title="Template-Statistiken")
    stats_table.add_column("Kategorie", style="cyan")
    stats_table.add_column("Anzahl", style="yellow")
    
    for level, count in stats['by_level'].items():
        stats_table.add_row(level.title(), str(count))
        
    console.print(stats_table)
    
    # Templates nach Level
    for level in ['nano', 'mikro', 'sub', 'domain', 'enterprise']:
        templates = template_registry.get_templates_by_level(level)
        
        if templates:
            console.print(f"\n[bold green]{level.title()}-Templates:[/bold green]")
            
            for template in templates[:5]:  # Zeige nur erste 5
                console.print(f"  • [cyan]{template['name']}[/cyan]: {template.get('description', 'N/A')}")
                
            if len(templates) > 5:
                console.print(f"  [dim]... und {len(templates) - 5} weitere[/dim]")


@cli.command()
@click.option('--format', '-f', type=click.Choice(['yaml', 'json']), default='yaml')
@click.option('--output', '-o', type=click.Path(), help='Output-Datei')
@click.pass_context
def export(ctx, format, output):
    """Exportiere Agent-Registry"""
    registry = ctx.obj['registry']
    
    if output:
        registry.export_registry(output, format)
        console.print(f"[green]Registry exportiert nach: {output}[/green]")
    else:
        # Export to stdout
        export_data = {
            'exported_at': datetime.now().isoformat(),
            'statistics': registry.get_statistics(),
            'agents': []
        }
        
        for name in registry.list_agents():
            agent = registry.get(name)
            if agent:
                export_data['agents'].append({
                    'name': agent.metadata.name,
                    'type': agent.agent_type.name,
                    'description': agent.metadata.description
                })
                
        if format == 'yaml':
            console.print(yaml.dump(export_data, default_flow_style=False))
        else:
            console.print(json.dumps(export_data, indent=2))


@cli.command()
def interactive():
    """Interaktiver Agent-Builder Modus"""
    console.print("\n[bold cyan]Interaktiver Agent-Builder[/bold cyan]\n")
    console.print("Willkommen im interaktiven Modus! Hier kannst du Schritt für Schritt")
    console.print("einen Agenten erstellen.\n")
    
    # Wähle Agent-Typ
    agent_type = Prompt.ask(
        "Welchen Agent-Typ möchtest du erstellen?",
        choices=['nano', 'mikro', 'sub', 'domain', 'enterprise']
    )
    
    # Rufe type-spezifischen Wizard auf
    spec = interactive_agent_creation(agent_type)
    
    # Zeige finale Spec
    console.print("\n[cyan]Finale Agent-Spezifikation:[/cyan]")
    syntax = Syntax(yaml.dump(spec, default_flow_style=False), "yaml", theme="monokai")
    console.print(syntax)
    
    # Erstelle Agent
    if Confirm.ask("\nAgent jetzt erstellen?"):
        ctx = click.get_current_context()
        ctx.invoke(create, agent_type=agent_type, spec_file=None, template=None, interactive=False)


def interactive_agent_creation(agent_type: str) -> Dict[str, Any]:
    """Interaktive Agent-Erstellung"""
    spec = {'type': agent_type}
    
    # Basis-Informationen
    spec['name'] = Prompt.ask("Agent-Name")
    spec['description'] = Prompt.ask("Beschreibung")
    
    if agent_type == 'nano':
        # Nano-spezifisch
        spec['action_type'] = Prompt.ask(
            "Action-Type",
            choices=['api_call', 'db_write', 'file_operation', 'computation', 'custom']
        )
        
        if spec['action_type'] == 'api_call':
            spec['endpoint'] = Prompt.ask("API Endpoint")
            spec['method'] = Prompt.ask("HTTP Method", default="GET")
            
        elif spec['action_type'] == 'db_write':
            spec['table_name'] = Prompt.ask("Tabellen-Name")
            
    elif agent_type == 'mikro':
        # Mikro-spezifisch
        spec['pipeline_mode'] = Prompt.ask(
            "Pipeline-Modus",
            choices=['sequential', 'parallel'],
            default='sequential'
        )
        
        # Nano-Agenten hinzufügen
        spec['nano_agents'] = []
        while True:
            nano_name = Prompt.ask("Nano-Agent hinzufügen (leer für Ende)")
            if not nano_name:
                break
            spec['nano_agents'].append(nano_name)
            
    elif agent_type == 'sub':
        # Sub-spezifisch
        spec['mikro_agents'] = []
        while True:
            mikro_name = Prompt.ask("Mikro-Agent hinzufügen (leer für Ende)")
            if not mikro_name:
                break
            spec['mikro_agents'].append(mikro_name)
            
        # Entscheidungslogik
        if Confirm.ask("Entscheidungslogik hinzufügen?"):
            spec['decision_logic'] = {
                'stop_on_error': Confirm.ask("Bei Fehler stoppen?", default=True)
            }
            
    elif agent_type == 'domain':
        # Domain-spezifisch
        spec['domain_type'] = Prompt.ask(
            "Domain-Typ",
            choices=['mail_ops', 'calendar_ops', 'compliance_ops', 'custom']
        )
        
        spec['sub_agents'] = []
        while True:
            sub_name = Prompt.ask("Sub-Agent hinzufügen (leer für Ende)")
            if not sub_name:
                break
            capabilities = Prompt.ask(f"Fähigkeiten für {sub_name} (komma-getrennt)")
            spec['sub_agents'].append({
                'agent': sub_name,
                'capabilities': [c.strip() for c in capabilities.split(',')]
            })
            
    elif agent_type == 'enterprise':
        # Enterprise-spezifisch
        spec['industry'] = Prompt.ask(
            "Branche",
            choices=['healthcare', 'legal', 'ecommerce', 'finance', 'custom']
        )
        spec['company_name'] = Prompt.ask("Firmenname")
        
        # Compliance
        compliance = Prompt.ask("Compliance-Anforderungen (komma-getrennt)", default="DSGVO")
        spec['compliance'] = [c.strip() for c in compliance.split(',')]
        
    return spec


def print_hierarchy(node: Dict[str, Any], level: int):
    """Drucke Agent-Hierarchie"""
    indent = "  " * level
    console.print(f"{indent}• [cyan]{node['name']}[/cyan] ({node['type']})")
    
    for child in node.get('children', []):
        print_hierarchy(child, level + 1)


if __name__ == '__main__':
    cli()