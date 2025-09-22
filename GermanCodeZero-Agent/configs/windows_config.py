"""
Windows 11 spezifische Konfiguration für DirectML/Vulkan GPU-Nutzung
"""

import os
import platform
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import psutil


class WindowsEnvironmentConfig:
    """
    Konfiguration für Windows 11 Umgebung mit DirectML und Vulkan Support
    """
    
    def __init__(self):
        """Initialisiere Windows-Konfiguration"""
        self.platform = platform.system()
        self.is_windows = self.platform == "Windows"
        self.windows_version = None
        self.gpu_info = {}
        self.directml_available = False
        self.vulkan_available = False
        
        if self.is_windows:
            self._detect_windows_version()
            self._detect_gpu_capabilities()
            
    def _detect_windows_version(self):
        """Erkenne Windows Version"""
        try:
            version = platform.version()
            # Windows 11 hat Build-Nummer >= 22000
            build = int(version.split('.')[2]) if '.' in version else 0
            self.windows_version = "11" if build >= 22000 else "10"
        except:
            self.windows_version = "Unknown"
            
    def _detect_gpu_capabilities(self):
        """Erkenne GPU und verfügbare APIs"""
        try:
            # DirectML Erkennung
            directml_dll = Path("C:/Windows/System32/DirectML.dll")
            self.directml_available = directml_dll.exists()
            
            # Vulkan Erkennung
            vulkan_dll = Path("C:/Windows/System32/vulkan-1.dll")
            self.vulkan_available = vulkan_dll.exists()
            
            # GPU Info via WMI (Windows Management Instrumentation)
            if self.is_windows:
                try:
                    result = subprocess.run(
                        ['wmic', 'path', 'win32_VideoController', 'get', 'name,driverversion'],
                        capture_output=True, text=True
                    )
                    if result.returncode == 0:
                        lines = result.stdout.strip().split('\n')[1:]  # Skip header
                        for line in lines:
                            if line.strip():
                                parts = line.strip().split()
                                if len(parts) >= 2:
                                    self.gpu_info['name'] = ' '.join(parts[:-1])
                                    self.gpu_info['driver'] = parts[-1]
                except:
                    pass
                    
        except Exception as e:
            print(f"GPU-Erkennung fehlgeschlagen: {e}")
            
    def get_optimal_settings(self) -> Dict[str, Any]:
        """
        Gibt optimale Einstellungen für Windows 11 zurück
        """
        settings = {
            'platform': self.platform,
            'windows_version': self.windows_version,
            'gpu': self.gpu_info,
            'directml': self.directml_available,
            'vulkan': self.vulkan_available,
            'recommendations': {}
        }
        
        # Empfehlungen basierend auf Hardware
        if self.directml_available:
            settings['recommendations']['heavy_models'] = {
                'backend': 'directml',
                'location': 'native',
                'models': [
                    'llama3:70b',
                    'mixtral:8x7b',
                    'deepseek-coder:33b'
                ]
            }
        else:
            settings['recommendations']['heavy_models'] = {
                'backend': 'cpu',
                'location': 'native',
                'note': 'DirectML nicht verfügbar, CPU-Fallback'
            }
            
        # Docker-Empfehlungen für leichte Modelle
        settings['recommendations']['light_models'] = {
            'backend': 'docker',
            'location': 'container',
            'models': [
                'mistral:7b',
                'phi-2',
                'codellama:7b'
            ]
        }
        
        return settings
        
    def generate_docker_compose(self) -> str:
        """
        Generiere Docker Compose Konfiguration für Windows 11
        """
        compose = """version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: germancodezero_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
    restart: unless-stopped
    
  qdrant:
    image: qdrant/qdrant
    container_name: germancodezero_qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped
    
  redis:
    image: redis:alpine
    container_name: germancodezero_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    container_name: germancodezero_postgres
    environment:
      POSTGRES_DB: germancodezero
      POSTGRES_USER: agent
      POSTGRES_PASSWORD: secure_password_here
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  ollama_data:
  qdrant_data:
  redis_data:
  postgres_data:
"""
        return compose
        
    def generate_powershell_setup(self) -> str:
        """
        Generiere PowerShell Setup-Skript für Windows 11
        """
        script = """# GermanCodeZero-Agent Windows 11 Setup Script
# Requires Administrator privileges

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host "GermanCodeZero-Agent Windows 11 Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Install Chocolatey if not present
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install required tools
Write-Host "Installing required tools..." -ForegroundColor Yellow

# Python 3.11
choco install python311 -y

# Docker Desktop
choco install docker-desktop -y

# Git
choco install git -y

# Visual C++ Redistributables (für DirectML)
choco install vcredist-all -y

# Check DirectML
Write-Host "Checking DirectML support..." -ForegroundColor Yellow
if (Test-Path "C:\Windows\System32\DirectML.dll") {
    Write-Host "DirectML found! GPU acceleration available." -ForegroundColor Green
} else {
    Write-Host "DirectML not found. Installing DirectML Runtime..." -ForegroundColor Yellow
    # DirectML wird normalerweise mit Windows Updates installiert
    Write-Host "Please ensure Windows is fully updated for DirectML support." -ForegroundColor Yellow
}

# Setup Python environment
Write-Host "Setting up Python environment..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m venv venv

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start Docker Desktop
Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

Write-Host "Waiting for Docker to start..." -ForegroundColor Yellow
$timeout = 60
$timer = [Diagnostics.Stopwatch]::StartNew()
while (($timer.Elapsed.TotalSeconds -lt $timeout) -and ((docker ps 2>&1) -match "error")) {
    Start-Sleep -Seconds 2
}
$timer.Stop()

if ((docker ps 2>&1) -match "error") {
    Write-Host "Docker failed to start. Please start Docker Desktop manually." -ForegroundColor Red
} else {
    Write-Host "Docker is running!" -ForegroundColor Green
    
    # Start Docker services
    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    docker-compose up -d
}

# Download Ollama for Windows
Write-Host "Downloading Ollama for Windows..." -ForegroundColor Yellow
$ollamaUrl = "https://ollama.ai/download/windows"
Write-Host "Please download and install Ollama from: $ollamaUrl" -ForegroundColor Cyan

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Install Ollama from the download link above"
Write-Host "2. Run 'ollama serve' in a separate terminal"
Write-Host "3. Run 'python setup_models.py' to download required models"
Write-Host "4. Start the GermanCodeZero-Agent with 'python main.py'"
"""
        return script
        
    def get_system_info(self) -> Dict[str, Any]:
        """
        Sammle System-Informationen
        """
        info = {
            'os': platform.system(),
            'os_version': platform.version(),
            'architecture': platform.machine(),
            'processor': platform.processor(),
            'cpu_count': os.cpu_count(),
            'memory': {
                'total': psutil.virtual_memory().total,
                'available': psutil.virtual_memory().available,
                'percent': psutil.virtual_memory().percent
            },
            'disk': {
                'total': psutil.disk_usage('/').total,
                'free': psutil.disk_usage('/').free,
                'percent': psutil.disk_usage('/').percent
            }
        }
        
        # GPU Info
        if self.gpu_info:
            info['gpu'] = self.gpu_info
            
        # API Support
        info['api_support'] = {
            'directml': self.directml_available,
            'vulkan': self.vulkan_available
        }
        
        return info


class ModelOptimizer:
    """
    Optimiert Model-Einstellungen für Windows 11
    """
    
    def __init__(self, system_config: WindowsEnvironmentConfig):
        """
        Initialisiere Model-Optimizer
        
        Args:
            system_config: Windows System-Konfiguration
        """
        self.config = system_config
        self.model_profiles = self._create_model_profiles()
        
    def _create_model_profiles(self) -> Dict[str, Dict[str, Any]]:
        """
        Erstelle optimierte Model-Profile basierend auf Hardware
        """
        profiles = {}
        
        # Schwere Modelle (70B+) - Nur mit GPU
        if self.config.directml_available:
            profiles['heavy'] = {
                'models': {
                    'llama3:70b': {
                        'quantization': 'q4_K_M',
                        'context_length': 4096,
                        'batch_size': 512,
                        'threads': os.cpu_count() // 2,
                        'gpu_layers': -1  # Alle Layer auf GPU
                    },
                    'mixtral:8x7b': {
                        'quantization': 'q4_K_M',
                        'context_length': 4096,
                        'batch_size': 512,
                        'gpu_layers': -1
                    }
                },
                'location': 'native',
                'backend': 'directml'
            }
            
        # Mittlere Modelle (7B-33B)
        profiles['medium'] = {
            'models': {
                'deepseek-coder:33b': {
                    'quantization': 'q4_K_M',
                    'context_length': 16384,
                    'batch_size': 256,
                    'threads': os.cpu_count() // 2,
                    'gpu_layers': 20 if self.config.directml_available else 0
                },
                'codellama:13b': {
                    'quantization': 'q4_K_M',
                    'context_length': 4096,
                    'batch_size': 256,
                    'gpu_layers': 15 if self.config.directml_available else 0
                }
            },
            'location': 'native',
            'backend': 'mixed'  # GPU + CPU
        }
        
        # Leichte Modelle (≤7B) - Ideal für Docker
        profiles['light'] = {
            'models': {
                'mistral:7b': {
                    'quantization': 'q4_K_M',
                    'context_length': 8192,
                    'batch_size': 512,
                    'threads': 4
                },
                'phi-2': {
                    'quantization': 'q4_0',
                    'context_length': 2048,
                    'batch_size': 512,
                    'threads': 4
                },
                'tinyllama': {
                    'quantization': 'q4_0',
                    'context_length': 2048,
                    'batch_size': 512,
                    'threads': 2
                }
            },
            'location': 'docker',
            'backend': 'cpu'
        }
        
        return profiles
        
    def get_optimal_model(self, task_type: str, 
                         constraints: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Wähle optimales Modell für eine Aufgabe
        
        Args:
            task_type: Typ der Aufgabe
            constraints: Zusätzliche Einschränkungen (memory, latency, etc.)
            
        Returns:
            Optimale Model-Konfiguration
        """
        # Task-zu-Model Mapping
        task_models = {
            'code_generation': ['deepseek-coder:33b', 'codellama:13b', 'codellama:7b'],
            'reasoning': ['llama3:70b', 'mixtral:8x7b', 'mistral:7b'],
            'classification': ['mistral:7b', 'phi-2'],
            'embedding': ['nomic-embed-text', 'all-minilm'],
            'simple_completion': ['tinyllama', 'phi-2']
        }
        
        available_models = task_models.get(task_type, ['mistral:7b'])
        
        # Wähle basierend auf Hardware und Constraints
        if constraints:
            max_memory = constraints.get('max_memory_gb', float('inf'))
            max_latency = constraints.get('max_latency_ms', float('inf'))
            
            # Filter basierend auf Constraints
            if max_memory < 16:
                # Nur leichte Modelle
                available_models = [m for m in available_models if '7b' in m or 'phi' in m or 'tiny' in m]
                
        # Wähle bestes verfügbares Modell
        for profile_name, profile in self.model_profiles.items():
            for model_name in available_models:
                if model_name in profile['models']:
                    return {
                        'model': model_name,
                        'config': profile['models'][model_name],
                        'location': profile['location'],
                        'backend': profile['backend']
                    }
                    
        # Fallback
        return {
            'model': 'mistral:7b',
            'config': self.model_profiles['light']['models']['mistral:7b'],
            'location': 'docker',
            'backend': 'cpu'
        }
        
    def estimate_resource_usage(self, model_name: str) -> Dict[str, Any]:
        """
        Schätze Ressourcen-Verbrauch für ein Modell
        
        Args:
            model_name: Name des Modells
            
        Returns:
            Geschätzte Ressourcen
        """
        # Vereinfachte Schätzungen
        model_sizes = {
            '70b': {'ram_gb': 40, 'vram_gb': 35, 'disk_gb': 40},
            '33b': {'ram_gb': 20, 'vram_gb': 18, 'disk_gb': 20},
            '13b': {'ram_gb': 10, 'vram_gb': 8, 'disk_gb': 8},
            '7b': {'ram_gb': 6, 'vram_gb': 5, 'disk_gb': 4},
            'phi': {'ram_gb': 3, 'vram_gb': 2, 'disk_gb': 2},
            'tiny': {'ram_gb': 1, 'vram_gb': 1, 'disk_gb': 1}
        }
        
        # Erkenne Model-Größe
        size_key = None
        for key in model_sizes:
            if key in model_name.lower():
                size_key = key
                break
                
        if not size_key:
            size_key = '7b'  # Default
            
        return {
            'model': model_name,
            'estimated_usage': model_sizes[size_key],
            'recommended_setup': 'GPU' if size_key in ['70b', '33b'] else 'CPU/Docker'
        }


# Utility-Funktionen
def check_windows_11_compatibility() -> Dict[str, bool]:
    """
    Prüfe Windows 11 Kompatibilität
    """
    checks = {
        'os_compatible': platform.system() == 'Windows',
        'python_version': platform.python_version() >= '3.11',
        'memory_sufficient': psutil.virtual_memory().total >= 16 * 1024**3,  # 16GB
        'disk_space': psutil.disk_usage('/').free >= 100 * 1024**3  # 100GB
    }
    
    # Prüfe Windows Version
    if checks['os_compatible']:
        try:
            version = platform.version()
            build = int(version.split('.')[2]) if '.' in version else 0
            checks['windows_11'] = build >= 22000
        except:
            checks['windows_11'] = False
    else:
        checks['windows_11'] = False
        
    checks['all_passed'] = all(checks.values())
    
    return checks


def generate_environment_report() -> str:
    """
    Generiere einen Umgebungs-Report
    """
    config = WindowsEnvironmentConfig()
    optimizer = ModelOptimizer(config)
    compatibility = check_windows_11_compatibility()
    
    report = f"""
GermanCodeZero-Agent Environment Report
======================================

System Information:
{json.dumps(config.get_system_info(), indent=2)}

Compatibility Check:
{json.dumps(compatibility, indent=2)}

Optimal Settings:
{json.dumps(config.get_optimal_settings(), indent=2)}

Recommended Models by Task:
- Code Generation: {json.dumps(optimizer.get_optimal_model('code_generation'), indent=2)}
- Reasoning: {json.dumps(optimizer.get_optimal_model('reasoning'), indent=2)}
- Classification: {json.dumps(optimizer.get_optimal_model('classification'), indent=2)}

Resource Estimates:
- Heavy Model (70B): {json.dumps(optimizer.estimate_resource_usage('llama3:70b'), indent=2)}
- Medium Model (33B): {json.dumps(optimizer.estimate_resource_usage('deepseek-coder:33b'), indent=2)}
- Light Model (7B): {json.dumps(optimizer.estimate_resource_usage('mistral:7b'), indent=2)}

Report generated at: {platform.node()} on {platform.platform()}
"""
    
    return report