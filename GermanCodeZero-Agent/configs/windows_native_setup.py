"""
Windows Native Setup - Kein Docker, alles nativ auf Windows 11
"""

import os
import sys
import subprocess
import platform
from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import asyncio
import aiohttp
import psutil


class WindowsNativeEnvironment:
    """
    Konfiguration für rein native Windows 11 Umgebung ohne Docker
    """
    
    def __init__(self):
        """Initialisiere Windows-native Umgebung"""
        self.is_windows = platform.system() == "Windows"
        if not self.is_windows:
            raise RuntimeError("Dieses Setup ist nur für Windows!")
            
        self.base_path = Path.home() / "GermanCodeZero"
        self.services = {}
        self.ports = {
            'ollama': 11434,
            'qdrant': 6333,
            'redis': 6379,
            'postgres': 5432,
            'n8n': 5678,
            'api': 8000
        }
        
    def setup_directories(self):
        """Erstelle alle benötigten Verzeichnisse"""
        directories = [
            self.base_path,
            self.base_path / "data",
            self.base_path / "data" / "postgres",
            self.base_path / "data" / "redis",
            self.base_path / "data" / "qdrant",
            self.base_path / "models",
            self.base_path / "logs",
            self.base_path / "config",
            self.base_path / "temp"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✓ Erstellt: {directory}")
            
    def install_windows_services(self):
        """Installiere alle Services nativ auf Windows"""
        
        print("\n=== Installation der Windows-nativen Services ===\n")
        
        # 1. PostgreSQL
        self._install_postgresql()
        
        # 2. Redis
        self._install_redis()
        
        # 3. Qdrant
        self._install_qdrant()
        
        # 4. Ollama
        self._install_ollama()
        
        # 5. n8n
        self._install_n8n()
        
    def _install_postgresql(self):
        """PostgreSQL für Windows installieren"""
        print("📦 PostgreSQL Installation...")
        
        # Check if already installed
        pg_path = Path("C:/Program Files/PostgreSQL/15/bin/pg_ctl.exe")
        if pg_path.exists():
            print("  ✓ PostgreSQL bereits installiert")
            return
            
        # Download und Installation via Chocolatey oder manuell
        install_script = f"""
# PostgreSQL Installation für Windows
$pgVersion = "15"
$pgPassword = "gcz_secure_2024"
$pgPort = {self.ports['postgres']}
$dataDir = "{self.base_path / 'data' / 'postgres'}"

# Download PostgreSQL installer
$url = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
$installer = "$env:TEMP\\postgresql-installer.exe"

Write-Host "Downloading PostgreSQL..."
Invoke-WebRequest -Uri $url -OutFile $installer

# Silent Installation
Write-Host "Installing PostgreSQL..."
Start-Process -FilePath $installer -ArgumentList @(
    "--mode", "unattended",
    "--unattendedmodeui", "none",
    "--prefix", "C:\\Program Files\\PostgreSQL\\15",
    "--datadir", $dataDir,
    "--serverport", $pgPort,
    "--superpassword", $pgPassword,
    "--disable-stackbuilder", "1"
) -Wait

Write-Host "PostgreSQL installed successfully!"
"""
        
        # Speichere und führe PowerShell Script aus
        script_path = self.base_path / "temp" / "install_postgres.ps1"
        script_path.write_text(install_script)
        
        print("  → Führe Installation aus (Administrator-Rechte erforderlich)...")
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script_path)], check=True)
        
    def _install_redis(self):
        """Redis für Windows installieren"""
        print("\n📦 Redis Installation...")
        
        # Redis für Windows (Memurai oder Redis-Windows-Port)
        redis_path = Path("C:/tools/redis/redis-server.exe")
        if redis_path.exists():
            print("  ✓ Redis bereits installiert")
            return
            
        install_script = f"""
# Redis für Windows Installation
$redisDir = "C:\\tools\\redis"
$redisPort = {self.ports['redis']}

# Erstelle Verzeichnis
New-Item -ItemType Directory -Force -Path $redisDir

# Download Redis für Windows (Memurai Community Edition)
$url = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
$zipFile = "$env:TEMP\\redis.zip"

Write-Host "Downloading Redis for Windows..."
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extracting Redis..."
Expand-Archive -Path $zipFile -DestinationPath $redisDir -Force

# Erstelle Konfiguration
$config = @"
bind 127.0.0.1
port $redisPort
dir {self.base_path / 'data' / 'redis'}
save 900 1
save 300 10
save 60 10000
maxmemory 2gb
maxmemory-policy allkeys-lru
"@

$config | Out-File -FilePath "$redisDir\\redis.conf" -Encoding UTF8

Write-Host "Redis installed successfully!"
"""
        
        script_path = self.base_path / "temp" / "install_redis.ps1"
        script_path.write_text(install_script)
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script_path)], check=True)
        
    def _install_qdrant(self):
        """Qdrant für Windows installieren"""
        print("\n📦 Qdrant Installation...")
        
        qdrant_path = self.base_path / "services" / "qdrant" / "qdrant.exe"
        if qdrant_path.exists():
            print("  ✓ Qdrant bereits installiert")
            return
            
        install_script = f"""
# Qdrant für Windows Installation
$qdrantDir = "{self.base_path / 'services' / 'qdrant'}"
$qdrantPort = {self.ports['qdrant']}

New-Item -ItemType Directory -Force -Path $qdrantDir

# Download Qdrant für Windows
$version = "v1.7.4"
$url = "https://github.com/qdrant/qdrant/releases/download/$version/qdrant-x86_64-pc-windows-msvc.zip"
$zipFile = "$env:TEMP\\qdrant.zip"

Write-Host "Downloading Qdrant..."
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extracting Qdrant..."
Expand-Archive -Path $zipFile -DestinationPath $qdrantDir -Force

# Erstelle Konfiguration
$config = @"
service:
  http_port: $qdrantPort
  grpc_port: 6334
  host: 0.0.0.0

storage:
  storage_path: {self.base_path / 'data' / 'qdrant'}
  
  on_disk_payload: true
  
log_level: INFO
"@

$config | Out-File -FilePath "$qdrantDir\\config.yaml" -Encoding UTF8

Write-Host "Qdrant installed successfully!"
"""
        
        script_path = self.base_path / "temp" / "install_qdrant.ps1"
        script_path.write_text(install_script)
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script_path)], check=True)
        
    def _install_ollama(self):
        """Ollama für Windows installieren"""
        print("\n📦 Ollama Installation...")
        
        # Check if Ollama is in PATH
        try:
            subprocess.run(["ollama", "--version"], capture_output=True, check=True)
            print("  ✓ Ollama bereits installiert")
            return
        except:
            pass
            
        print("  → Bitte installiere Ollama manuell von: https://ollama.ai/download/windows")
        print("  → Nach Installation führe aus: ollama serve")
        
    def _install_n8n(self):
        """n8n für Windows installieren (via npm)"""
        print("\n📦 n8n Installation...")
        
        # Check Node.js
        try:
            subprocess.run(["node", "--version"], capture_output=True, check=True)
        except:
            print("  ❌ Node.js nicht gefunden! Bitte zuerst Node.js installieren.")
            return
            
        # Install n8n global
        print("  → Installiere n8n via npm...")
        subprocess.run(["npm", "install", "-g", "n8n"], check=True)
        
    def create_service_configs(self):
        """Erstelle Konfigurationsdateien für alle Services"""
        
        # PostgreSQL Initialisierung
        pg_init_sql = """
-- GermanCodeZero PostgreSQL Setup
CREATE DATABASE germancodezero;
CREATE USER gcz_agent WITH ENCRYPTED PASSWORD 'gcz_secure_2024';
GRANT ALL PRIVILEGES ON DATABASE germancodezero TO gcz_agent;

\\c germancodezero;

-- Erstelle Schemas
CREATE SCHEMA IF NOT EXISTS agents;
CREATE SCHEMA IF NOT EXISTS workflows;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT ALL ON SCHEMA agents TO gcz_agent;
GRANT ALL ON SCHEMA workflows TO gcz_agent;
GRANT ALL ON SCHEMA audit TO gcz_agent;
"""
        
        (self.base_path / "config" / "postgres_init.sql").write_text(pg_init_sql)
        
        # Windows Service Starter Scripts
        self._create_service_scripts()
        
    def _create_service_scripts(self):
        """Erstelle Start-Scripts für alle Services"""
        
        # Master Start Script
        master_script = f"""@echo off
echo === Starting GermanCodeZero Services (Windows Native) ===
echo.

:: Start PostgreSQL
echo Starting PostgreSQL...
start "PostgreSQL" cmd /k "cd /d C:\\Program Files\\PostgreSQL\\15\\bin && pg_ctl -D {self.base_path / 'data' / 'postgres'} start"

:: Start Redis
echo Starting Redis...
start "Redis" cmd /k "cd /d C:\\tools\\redis && redis-server redis.conf"

:: Start Qdrant
echo Starting Qdrant...
start "Qdrant" cmd /k "cd /d {self.base_path / 'services' / 'qdrant'} && qdrant.exe --config-path config.yaml"

:: Start Ollama
echo Starting Ollama...
start "Ollama" cmd /k "ollama serve"

:: Wait a bit
timeout /t 5

:: Start n8n
echo Starting n8n...
set N8N_PORT={self.ports['n8n']}
set N8N_BASIC_AUTH_ACTIVE=true
set N8N_BASIC_AUTH_USER=admin
set N8N_BASIC_AUTH_PASSWORD=gcz2024
set DB_TYPE=postgresdb
set DB_POSTGRESDB_HOST=localhost
set DB_POSTGRESDB_PORT={self.ports['postgres']}
set DB_POSTGRESDB_DATABASE=germancodezero
set DB_POSTGRESDB_USER=gcz_agent
set DB_POSTGRESDB_PASSWORD=gcz_secure_2024

start "n8n" cmd /k "n8n start"

echo.
echo All services started!
echo.
echo Service URLs:
echo - Ollama:     http://localhost:{self.ports['ollama']}
echo - Qdrant:     http://localhost:{self.ports['qdrant']}
echo - Redis:      localhost:{self.ports['redis']}
echo - PostgreSQL: localhost:{self.ports['postgres']}
echo - n8n:        http://localhost:{self.ports['n8n']}
echo.
pause
"""
        
        (self.base_path / "start_all_services.bat").write_text(master_script)
        
        # Stop Script
        stop_script = f"""@echo off
echo === Stopping GermanCodeZero Services ===
echo.

:: Stop PostgreSQL
echo Stopping PostgreSQL...
"C:\\Program Files\\PostgreSQL\\15\\bin\\pg_ctl" -D {self.base_path / 'data' / 'postgres'} stop

:: Stop Redis
echo Stopping Redis...
taskkill /IM redis-server.exe /F

:: Stop Qdrant
echo Stopping Qdrant...
taskkill /IM qdrant.exe /F

:: Stop Ollama
echo Stopping Ollama...
taskkill /IM ollama.exe /F

:: Stop n8n
echo Stopping n8n...
taskkill /IM node.exe /F

echo.
echo All services stopped!
pause
"""
        
        (self.base_path / "stop_all_services.bat").write_text(stop_script)
        
    def create_python_service_manager(self):
        """Python-basierter Service Manager für Windows"""
        
        service_manager = f'''"""
Windows Service Manager für GermanCodeZero
"""

import subprocess
import psutil
import time
from pathlib import Path
import sys
import os

class WindowsServiceManager:
    """Verwalte native Windows Services für GermanCodeZero"""
    
    def __init__(self):
        self.base_path = Path("{self.base_path}")
        self.services = {{
            'postgresql': {{
                'name': 'PostgreSQL',
                'exe': 'postgres.exe',
                'start_cmd': ['C:/Program Files/PostgreSQL/15/bin/pg_ctl.exe', 
                             '-D', str(self.base_path / 'data' / 'postgres'), 'start'],
                'stop_cmd': ['C:/Program Files/PostgreSQL/15/bin/pg_ctl.exe', 
                            '-D', str(self.base_path / 'data' / 'postgres'), 'stop'],
                'port': {self.ports['postgres']}
            }},
            'redis': {{
                'name': 'Redis',
                'exe': 'redis-server.exe',
                'start_cmd': ['C:/tools/redis/redis-server.exe', 'C:/tools/redis/redis.conf'],
                'port': {self.ports['redis']}
            }},
            'qdrant': {{
                'name': 'Qdrant',
                'exe': 'qdrant.exe',
                'start_cmd': [str(self.base_path / 'services' / 'qdrant' / 'qdrant.exe'),
                             '--config-path', str(self.base_path / 'services' / 'qdrant' / 'config.yaml')],
                'port': {self.ports['qdrant']}
            }},
            'ollama': {{
                'name': 'Ollama',
                'exe': 'ollama.exe',
                'start_cmd': ['ollama', 'serve'],
                'port': {self.ports['ollama']}
            }}
        }}
        
    def is_service_running(self, service_name: str) -> bool:
        """Prüfe ob Service läuft"""
        service = self.services.get(service_name)
        if not service:
            return False
            
        # Check by process name
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                if service['exe'] in proc.info['name']:
                    return True
            except:
                pass
                
        # Check by port
        for conn in psutil.net_connections():
            if conn.laddr.port == service.get('port') and conn.status == 'LISTEN':
                return True
                
        return False
        
    def start_service(self, service_name: str) -> bool:
        """Starte einen Service"""
        if self.is_service_running(service_name):
            print(f"✓ {{service_name}} läuft bereits")
            return True
            
        service = self.services.get(service_name)
        if not service:
            print(f"✗ Unbekannter Service: {{service_name}}")
            return False
            
        print(f"Starting {{service['name']}}...")
        try:
            subprocess.Popen(service['start_cmd'], 
                           creationflags=subprocess.CREATE_NEW_CONSOLE)
            time.sleep(3)  # Wait for startup
            
            if self.is_service_running(service_name):
                print(f"✓ {{service['name']}} gestartet")
                return True
            else:
                print(f"✗ {{service['name']}} konnte nicht gestartet werden")
                return False
        except Exception as e:
            print(f"✗ Fehler beim Starten von {{service['name']}}: {{e}}")
            return False
            
    def stop_service(self, service_name: str) -> bool:
        """Stoppe einen Service"""
        if not self.is_service_running(service_name):
            print(f"{{service_name}} läuft nicht")
            return True
            
        service = self.services.get(service_name)
        if not service:
            return False
            
        print(f"Stopping {{service['name']}}...")
        
        # Special handling for PostgreSQL
        if service_name == 'postgresql' and 'stop_cmd' in service:
            subprocess.run(service['stop_cmd'], check=True)
        else:
            # Kill by process name
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    if service['exe'] in proc.info['name']:
                        proc.terminate()
                        proc.wait(timeout=5)
                except:
                    pass
                    
        time.sleep(2)
        
        if not self.is_service_running(service_name):
            print(f"✓ {{service['name']}} gestoppt")
            return True
        else:
            print(f"✗ {{service['name']}} konnte nicht gestoppt werden")
            return False
            
    def start_all(self):
        """Starte alle Services"""
        print("=== Starting all GermanCodeZero services ===\\n")
        for service_name in self.services:
            self.start_service(service_name)
        print("\\n✓ All services started")
        
    def stop_all(self):
        """Stoppe alle Services"""
        print("=== Stopping all GermanCodeZero services ===\\n")
        for service_name in reversed(list(self.services.keys())):
            self.stop_service(service_name)
        print("\\n✓ All services stopped")
        
    def status(self):
        """Zeige Status aller Services"""
        print("=== GermanCodeZero Service Status ===\\n")
        for service_name, service in self.services.items():
            running = self.is_service_running(service_name)
            status = "🟢 Running" if running else "🔴 Stopped"
            print(f"{{service['name']:<15}} {{status}}")
            if running and 'port' in service:
                print(f"{{'':<15}} Port: {{service['port']}}")
        print()

if __name__ == "__main__":
    import sys
    
    manager = WindowsServiceManager()
    
    if len(sys.argv) < 2:
        print("Usage: python service_manager.py [start|stop|status|start-all|stop-all]")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "start-all":
        manager.start_all()
    elif command == "stop-all":
        manager.stop_all()
    elif command == "status":
        manager.status()
    elif command == "start" and len(sys.argv) > 2:
        manager.start_service(sys.argv[2])
    elif command == "stop" and len(sys.argv) > 2:
        manager.stop_service(sys.argv[2])
    else:
        print("Invalid command")
'''
        
        (self.base_path / "service_manager.py").write_text(service_manager)
        
    def create_environment_file(self):
        """Erstelle .env Datei für Windows-native Umgebung"""
        
        env_content = f"""# GermanCodeZero Windows Native Environment

# Paths
GCZ_BASE_PATH={self.base_path}
GCZ_DATA_PATH={self.base_path / 'data'}
GCZ_MODELS_PATH={self.base_path / 'models'}

# Service URLs (alle lokal)
OLLAMA_HOST=http://localhost:{self.ports['ollama']}
QDRANT_URL=http://localhost:{self.ports['qdrant']}
REDIS_URL=redis://localhost:{self.ports['redis']}
DATABASE_URL=postgresql://gcz_agent:gcz_secure_2024@localhost:{self.ports['postgres']}/germancodezero

# DirectML/Vulkan Settings
USE_DIRECTML=true
USE_VULKAN=false
GPU_LAYERS=-1

# Model Settings
DEFAULT_CODE_MODEL=deepseek-coder:33b
DEFAULT_REASONING_MODEL=llama3:70b
DEFAULT_LIGHT_MODEL=mistral:7b

# Windows-specific
WINDOWS_NATIVE=true
USE_DOCKER=false

# Agent Settings
AGENT_REGISTRY_PATH={self.base_path / 'data' / 'registry.db'}
AGENT_WORKSPACE_PATH={self.base_path / 'workspace'}
AGENT_LOG_PATH={self.base_path / 'logs'}

# n8n Settings
N8N_PORT={self.ports['n8n']}
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=gcz2024
"""
        
        (self.base_path / ".env").write_text(env_content)
        
    def setup_complete(self):
        """Führe komplettes Setup aus"""
        print("=== GermanCodeZero Windows Native Setup ===\n")
        
        # 1. Verzeichnisse erstellen
        print("1. Erstelle Verzeichnisse...")
        self.setup_directories()
        
        # 2. Services installieren
        print("\n2. Installiere Windows Services...")
        self.install_windows_services()
        
        # 3. Konfigurationen erstellen
        print("\n3. Erstelle Konfigurationsdateien...")
        self.create_service_configs()
        
        # 4. Service Manager erstellen
        print("\n4. Erstelle Service Manager...")
        self.create_python_service_manager()
        
        # 5. Environment File
        print("\n5. Erstelle Environment-Datei...")
        self.create_environment_file()
        
        print("\n✅ Setup abgeschlossen!")
        print(f"\nAlle Dateien wurden in {self.base_path} erstellt.")
        print("\nNächste Schritte:")
        print(f"1. Starte alle Services: {self.base_path}\\start_all_services.bat")
        print(f"2. Oder nutze Python: python {self.base_path}\\service_manager.py start-all")
        print(f"3. Kopiere .env nach: {Path.cwd() / '.env'}")


def main():
    """Hauptfunktion für Windows Native Setup"""
    setup = WindowsNativeEnvironment()
    setup.setup_complete()


if __name__ == "__main__":
    # Prüfe ob Windows
    if platform.system() != "Windows":
        print("❌ Dieses Setup ist nur für Windows!")
        sys.exit(1)
        
    # Prüfe Admin-Rechte
    try:
        import ctypes
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except:
        is_admin = False
        
    if not is_admin:
        print("⚠️  Warnung: Einige Installationen benötigen Administrator-Rechte!")
        print("   Empfohlen: Als Administrator ausführen\n")
        
    main()