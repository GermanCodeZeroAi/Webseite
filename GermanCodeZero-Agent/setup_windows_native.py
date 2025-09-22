#!/usr/bin/env python3
"""
Setup-Skript für GermanCodeZero-Agent - Windows Native (ohne Docker)
"""

import os
import sys
import platform
import subprocess
from pathlib import Path
import shutil
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
import asyncio

console = Console()


def check_windows():
    """Prüfe ob Windows-System"""
    if platform.system() != "Windows":
        console.print("[red]❌ Dieses Setup ist nur für Windows![/red]")
        sys.exit(1)
        
    # Windows Version prüfen
    version = platform.version()
    build = int(version.split('.')[2]) if '.' in version else 0
    is_win11 = build >= 22000
    
    console.print(f"[green]✓ Windows erkannt[/green]")
    console.print(f"  Version: {'Windows 11' if is_win11 else 'Windows 10'} (Build {build})")
    
    return is_win11


def check_admin():
    """Prüfe Admin-Rechte"""
    try:
        import ctypes
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except:
        is_admin = False
        
    if not is_admin:
        console.print("[yellow]⚠️  Warnung: Keine Administrator-Rechte![/yellow]")
        console.print("   Einige Installationen könnten fehlschlagen.")
        console.print("   Empfohlen: Als Administrator ausführen\n")
        
    return is_admin


def check_prerequisites():
    """Prüfe Voraussetzungen"""
    console.print("\n[cyan]Prüfe Voraussetzungen...[/cyan]")
    
    prereqs = {
        'Python 3.11+': check_python_version(),
        'Node.js': check_command('node --version'),
        'Git': check_command('git --version'),
        'PowerShell': check_command('powershell -Command "echo test"'),
    }
    
    # Zeige Ergebnisse
    all_ok = True
    for name, ok in prereqs.items():
        if ok:
            console.print(f"  ✓ {name}")
        else:
            console.print(f"  ✗ {name}")
            all_ok = False
            
    return all_ok


def check_python_version():
    """Prüfe Python Version"""
    return sys.version_info >= (3, 11)


def check_command(cmd):
    """Prüfe ob Kommando verfügbar"""
    try:
        subprocess.run(cmd.split(), capture_output=True, check=True)
        return True
    except:
        return False


def install_windows_services():
    """Installiere alle benötigten Windows-Services"""
    console.print("\n[cyan]Installiere Windows-native Services...[/cyan]\n")
    
    services = [
        ("Ollama", install_ollama),
        ("PostgreSQL", install_postgresql),
        ("Redis", install_redis),
        ("Qdrant", install_qdrant),
        ("n8n", install_n8n),
    ]
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        
        for service_name, install_func in services:
            task = progress.add_task(f"Installiere {service_name}...", total=1)
            
            try:
                success = install_func()
                if success:
                    progress.update(task, completed=1)
                    console.print(f"[green]✓ {service_name} installiert[/green]")
                else:
                    console.print(f"[yellow]⚠ {service_name} übersprungen oder manuell nötig[/yellow]")
            except Exception as e:
                console.print(f"[red]✗ {service_name} Fehler: {e}[/red]")


def install_ollama():
    """Installiere Ollama für Windows"""
    # Prüfe ob bereits installiert
    if check_command('ollama --version'):
        return True
        
    console.print("\n[yellow]Ollama muss manuell installiert werden:[/yellow]")
    console.print("1. Gehe zu: https://ollama.ai/download/windows")
    console.print("2. Lade OllamaSetup.exe herunter und installiere")
    console.print("3. Nach Installation führe aus: ollama serve")
    
    return False


def install_postgresql():
    """Installiere PostgreSQL für Windows"""
    pg_path = Path("C:/Program Files/PostgreSQL/15/bin/pg_ctl.exe")
    if pg_path.exists():
        return True
        
    # Chocolatey Installation
    if check_command('choco --version'):
        console.print("  Installiere PostgreSQL via Chocolatey...")
        subprocess.run(['choco', 'install', 'postgresql', '-y'], check=True)
        return True
    else:
        console.print("[yellow]  PostgreSQL manuell installieren von: https://www.postgresql.org/download/windows/[/yellow]")
        return False


def install_redis():
    """Installiere Redis für Windows"""
    redis_path = Path("C:/tools/redis/redis-server.exe")
    if redis_path.exists():
        return True
        
    # Download Redis für Windows
    console.print("  Lade Redis für Windows herunter...")
    
    # PowerShell Script für Download
    ps_script = """
$url = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
$output = "$env:TEMP\\redis.zip"
$destination = "C:\\tools\\redis"

# Download
Invoke-WebRequest -Uri $url -OutFile $output

# Extract
New-Item -ItemType Directory -Force -Path $destination
Expand-Archive -Path $output -DestinationPath $destination -Force

Write-Host "Redis installed to $destination"
"""
    
    try:
        subprocess.run(['powershell', '-Command', ps_script], check=True)
        return True
    except:
        return False


def install_qdrant():
    """Installiere Qdrant für Windows"""
    base_path = Path.home() / "GermanCodeZero"
    qdrant_path = base_path / "services" / "qdrant" / "qdrant.exe"
    
    if qdrant_path.exists():
        return True
        
    console.print("  Lade Qdrant für Windows herunter...")
    
    # Erstelle Verzeichnis
    qdrant_path.parent.mkdir(parents=True, exist_ok=True)
    
    # PowerShell Script für Download
    ps_script = f"""
$version = "v1.7.4"
$url = "https://github.com/qdrant/qdrant/releases/download/$version/qdrant-x86_64-pc-windows-msvc.zip"
$output = "$env:TEMP\\qdrant.zip"
$destination = "{qdrant_path.parent}"

# Download
Invoke-WebRequest -Uri $url -OutFile $output

# Extract
Expand-Archive -Path $output -DestinationPath $destination -Force

Write-Host "Qdrant installed to $destination"
"""
    
    try:
        subprocess.run(['powershell', '-Command', ps_script], check=True)
        return True
    except:
        return False


def install_n8n():
    """Installiere n8n via npm"""
    if check_command('n8n --version'):
        return True
        
    if not check_command('npm --version'):
        console.print("[red]  npm nicht gefunden! Bitte Node.js installieren.[/red]")
        return False
        
    console.print("  Installiere n8n global via npm...")
    try:
        subprocess.run(['npm', 'install', '-g', 'n8n'], check=True)
        return True
    except:
        return False


def setup_directories():
    """Erstelle alle benötigten Verzeichnisse"""
    console.print("\n[cyan]Erstelle Verzeichnisstruktur...[/cyan]")
    
    base_path = Path.home() / "GermanCodeZero"
    
    directories = [
        base_path,
        base_path / "data" / "postgres",
        base_path / "data" / "redis", 
        base_path / "data" / "qdrant",
        base_path / "data" / "registry",
        base_path / "models",
        base_path / "logs",
        base_path / "workspace",
        base_path / "config",
        base_path / "services",
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        console.print(f"  ✓ {directory}")
        
    return base_path


def create_config_files(base_path: Path):
    """Erstelle Konfigurationsdateien"""
    console.print("\n[cyan]Erstelle Konfigurationsdateien...[/cyan]")
    
    # PostgreSQL init
    pg_init = """
CREATE DATABASE IF NOT EXISTS germancodezero;
CREATE USER IF NOT EXISTS gcz_agent WITH ENCRYPTED PASSWORD 'gcz_secure_2024';
GRANT ALL PRIVILEGES ON DATABASE germancodezero TO gcz_agent;
"""
    
    (base_path / "config" / "postgres_init.sql").write_text(pg_init)
    
    # Redis config
    redis_config = f"""
bind 127.0.0.1
port 6379
dir {base_path / 'data' / 'redis'}
save 900 1
save 300 10
save 60 10000
maxmemory 2gb
maxmemory-policy allkeys-lru
"""
    
    (base_path / "config" / "redis.conf").write_text(redis_config)
    
    # Qdrant config
    qdrant_config = f"""
service:
  http_port: 6333
  grpc_port: 6334
  host: 0.0.0.0

storage:
  storage_path: {base_path / 'data' / 'qdrant'}
  on_disk_payload: true

log_level: INFO
"""
    
    (base_path / "config" / "qdrant.yaml").write_text(qdrant_config)
    
    console.print("  ✓ Konfigurationsdateien erstellt")


def create_start_scripts(base_path: Path):
    """Erstelle Start-Skripte für alle Services"""
    console.print("\n[cyan]Erstelle Start-Skripte...[/cyan]")
    
    # Batch-Datei für alle Services
    start_all = f"""@echo off
echo === Starting GermanCodeZero Services (Windows Native) ===
echo.

:: Start Ollama
echo Starting Ollama...
start "Ollama" cmd /k "ollama serve"

:: Start PostgreSQL (wenn als Service installiert)
echo Starting PostgreSQL...
net start postgresql-x64-15 2>nul || (
    echo PostgreSQL Service nicht gefunden, starte manuell...
    start "PostgreSQL" cmd /k ""C:\\Program Files\\PostgreSQL\\15\\bin\\pg_ctl" -D "{base_path}\\data\\postgres" start"
)

:: Start Redis
echo Starting Redis...
start "Redis" cmd /k "C:\\tools\\redis\\redis-server.exe {base_path}\\config\\redis.conf"

:: Start Qdrant
echo Starting Qdrant...
start "Qdrant" cmd /k "{base_path}\\services\\qdrant\\qdrant.exe --config-path {base_path}\\config\\qdrant.yaml"

:: Wait for services
timeout /t 5

:: Start n8n
echo Starting n8n...
set N8N_PORT=5678
set N8N_BASIC_AUTH_ACTIVE=true
set N8N_BASIC_AUTH_USER=admin
set N8N_BASIC_AUTH_PASSWORD=gcz2024
set DB_TYPE=postgresdb
set DB_POSTGRESDB_HOST=localhost
set DB_POSTGRESDB_PORT=5432
set DB_POSTGRESDB_DATABASE=germancodezero
set DB_POSTGRESDB_USER=gcz_agent
set DB_POSTGRESDB_PASSWORD=gcz_secure_2024

start "n8n" cmd /k "n8n start"

echo.
echo All services starting...
echo.
echo Service URLs:
echo - Ollama:     http://localhost:11434
echo - PostgreSQL: localhost:5432
echo - Redis:      localhost:6379  
echo - Qdrant:     http://localhost:6333
echo - n8n:        http://localhost:5678 (admin/gcz2024)
echo.
echo GermanCodeZero API wird separat gestartet mit:
echo   python main.py web
echo.
pause
"""
    
    (base_path / "start_services.bat").write_text(start_all)
    
    # Stop-Skript
    stop_all = """@echo off
echo === Stopping GermanCodeZero Services ===
echo.

taskkill /IM ollama.exe /F 2>nul
taskkill /IM postgres.exe /F 2>nul
taskkill /IM redis-server.exe /F 2>nul
taskkill /IM qdrant.exe /F 2>nul
taskkill /IM node.exe /F 2>nul

net stop postgresql-x64-15 2>nul

echo.
echo All services stopped.
pause
"""
    
    (base_path / "stop_services.bat").write_text(stop_all)
    
    console.print("  ✓ Start-Skripte erstellt")
    
    return base_path / "start_services.bat"


def copy_env_file():
    """Kopiere Windows .env Datei"""
    console.print("\n[cyan]Konfiguriere Environment...[/cyan]")
    
    src = Path(".env.windows")
    dst = Path(".env")
    
    if src.exists():
        shutil.copy(src, dst)
        console.print("  ✓ .env.windows → .env kopiert")
    else:
        console.print("  [yellow]⚠ .env.windows nicht gefunden[/yellow]")


async def download_models():
    """Lade empfohlene Modelle herunter"""
    console.print("\n[cyan]Möchtest du die empfohlenen Modelle herunterladen?[/cyan]")
    console.print("Dies kann je nach Internetverbindung längere Zeit dauern.\n")
    
    models = [
        ("mistral:7b", "Allzweck-Modell (4GB)"),
        ("phi-2", "Schnelles kleines Modell (1.7GB)"),
        ("codellama:7b", "Code-Generierung (4GB)"),
        ("nomic-embed-text", "Text-Embeddings (274MB)")
    ]
    
    console.print("Empfohlene Modelle:")
    for model, desc in models:
        console.print(f"  • {model}: {desc}")
        
    response = console.input("\n[cyan]Modelle jetzt herunterladen? (j/n): [/cyan]")
    
    if response.lower() in ['j', 'ja', 'y', 'yes']:
        console.print("\n[yellow]Stelle sicher, dass Ollama läuft (ollama serve)[/yellow]")
        console.input("Drücke Enter wenn bereit...")
        
        for model, desc in models:
            console.print(f"\nLade {model} herunter...")
            try:
                subprocess.run(['ollama', 'pull', model], check=True)
                console.print(f"[green]✓ {model} heruntergeladen[/green]")
            except Exception as e:
                console.print(f"[red]✗ Fehler bei {model}: {e}[/red]")


def main():
    """Hauptfunktion"""
    console.print(Panel.fit(
        "[bold blue]GermanCodeZero-Agent[/bold blue]\n"
        "[yellow]Windows Native Setup (ohne Docker)[/yellow]",
        border_style="blue"
    ))
    
    # 1. System-Checks
    is_win11 = check_windows()
    is_admin = check_admin()
    
    # 2. Prerequisites
    if not check_prerequisites():
        console.print("\n[red]❌ Nicht alle Voraussetzungen erfüllt![/red]")
        console.print("Bitte installiere fehlende Komponenten und starte neu.")
        return
        
    # 3. Services installieren
    install_windows_services()
    
    # 4. Verzeichnisse erstellen
    base_path = setup_directories()
    
    # 5. Konfigurationsdateien
    create_config_files(base_path)
    
    # 6. Start-Skripte
    start_script = create_start_scripts(base_path)
    
    # 7. Environment
    copy_env_file()
    
    # 8. Modelle
    asyncio.run(download_models())
    
    # Abschluss
    console.print("\n" + "="*60)
    console.print(Panel.fit(
        "[bold green]Setup abgeschlossen![/bold green]\n\n"
        f"Alle Dateien wurden in:\n{base_path}\n\n"
        "Nächste Schritte:\n"
        f"1. Starte alle Services: {start_script}\n"
        "2. Aktiviere Python venv: venv\\Scripts\\activate\n"
        "3. Installiere Dependencies: pip install -r requirements.txt\n"
        "4. Starte GermanCodeZero: python main.py web\n\n"
        "Service-URLs:\n"
        "• API: http://localhost:8000\n"
        "• n8n: http://localhost:5678 (admin/gcz2024)\n"
        "• Dokumentation: http://localhost:8000/docs",
        border_style="green"
    ))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Setup abgebrochen.[/yellow]")
    except Exception as e:
        console.print(f"\n[red]Fehler: {e}[/red]")
        console.print_exception()