# GermanCodeZero-Agent Windows Installation Script
# Führe aus mit: powershell -ExecutionPolicy Bypass .\install_windows.ps1

Write-Host @"
╔═══════════════════════════════════════════════════════════════╗
║             GermanCodeZero-Agent Windows Installer            ║
║                    100% Native - Kein Docker!                 ║
╚═══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Blue

# Prüfe ob als Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Warnung: Skript läuft nicht als Administrator!" -ForegroundColor Yellow
    Write-Host "   Einige Installationen könnten fehlschlagen." -ForegroundColor Yellow
    Write-Host ""
}

# Setze Basis-Pfad
$GCZ_BASE = "$env:USERPROFILE\GermanCodeZero"

Write-Host "📁 Installation nach: $GCZ_BASE" -ForegroundColor Cyan
Write-Host ""

# Funktion zum Prüfen von Befehlen
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# 1. Prüfe Voraussetzungen
Write-Host "1️⃣ Prüfe Voraussetzungen..." -ForegroundColor Green

$prerequisites = @{
    "Python 3.11+" = Test-Command "python"
    "Git" = Test-Command "git"
    "Node.js" = Test-Command "node"
}

$allOk = $true
foreach ($prereq in $prerequisites.GetEnumerator()) {
    if ($prereq.Value) {
        Write-Host "   ✓ $($prereq.Key)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $($prereq.Key)" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "❌ Nicht alle Voraussetzungen erfüllt!" -ForegroundColor Red
    Write-Host "   Bitte installiere fehlende Komponenten." -ForegroundColor Red
    exit 1
}

# 2. Erstelle Verzeichnisstruktur
Write-Host ""
Write-Host "2️⃣ Erstelle Verzeichnisse..." -ForegroundColor Green

$directories = @(
    "$GCZ_BASE",
    "$GCZ_BASE\data\postgres",
    "$GCZ_BASE\data\redis",
    "$GCZ_BASE\data\qdrant",
    "$GCZ_BASE\models",
    "$GCZ_BASE\logs",
    "$GCZ_BASE\config",
    "$GCZ_BASE\services",
    "$GCZ_BASE\workspace"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "   ✓ $dir" -ForegroundColor Gray
}

# 3. Installiere Ollama
Write-Host ""
Write-Host "3️⃣ Prüfe Ollama..." -ForegroundColor Green

if (Test-Command "ollama") {
    Write-Host "   ✓ Ollama bereits installiert" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ollama nicht gefunden!" -ForegroundColor Yellow
    Write-Host "   Bitte manuell installieren von: https://ollama.ai/download/windows" -ForegroundColor Yellow
    Write-Host "   Nach Installation führe aus: ollama serve" -ForegroundColor Yellow
}

# 4. Installiere PostgreSQL
Write-Host ""
Write-Host "4️⃣ Prüfe PostgreSQL..." -ForegroundColor Green

$pgPath = "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe"
if (Test-Path $pgPath) {
    Write-Host "   ✓ PostgreSQL bereits installiert" -ForegroundColor Green
} else {
    if (Test-Command "choco") {
        Write-Host "   Installing PostgreSQL via Chocolatey..." -ForegroundColor Yellow
        choco install postgresql15 -y
    } else {
        Write-Host "   ⚠️  PostgreSQL nicht gefunden!" -ForegroundColor Yellow
        Write-Host "   Installiere von: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    }
}

# 5. Installiere Redis für Windows
Write-Host ""
Write-Host "5️⃣ Installiere Redis..." -ForegroundColor Green

$redisPath = "C:\tools\redis\redis-server.exe"
if (Test-Path $redisPath) {
    Write-Host "   ✓ Redis bereits installiert" -ForegroundColor Green
} else {
    Write-Host "   Lade Redis für Windows herunter..." -ForegroundColor Yellow
    
    $redisUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
    $redisZip = "$env:TEMP\redis.zip"
    $redisDir = "C:\tools\redis"
    
    # Download
    Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip
    
    # Extract
    New-Item -ItemType Directory -Force -Path $redisDir | Out-Null
    Expand-Archive -Path $redisZip -DestinationPath $redisDir -Force
    
    Write-Host "   ✓ Redis installiert nach $redisDir" -ForegroundColor Green
}

# 6. Installiere Qdrant
Write-Host ""
Write-Host "6️⃣ Installiere Qdrant..." -ForegroundColor Green

$qdrantPath = "$GCZ_BASE\services\qdrant\qdrant.exe"
if (Test-Path $qdrantPath) {
    Write-Host "   ✓ Qdrant bereits installiert" -ForegroundColor Green
} else {
    Write-Host "   Lade Qdrant für Windows herunter..." -ForegroundColor Yellow
    
    $qdrantUrl = "https://github.com/qdrant/qdrant/releases/download/v1.7.4/qdrant-x86_64-pc-windows-msvc.zip"
    $qdrantZip = "$env:TEMP\qdrant.zip"
    $qdrantDir = "$GCZ_BASE\services\qdrant"
    
    # Download
    Invoke-WebRequest -Uri $qdrantUrl -OutFile $qdrantZip
    
    # Extract
    New-Item -ItemType Directory -Force -Path $qdrantDir | Out-Null
    Expand-Archive -Path $qdrantZip -DestinationPath $qdrantDir -Force
    
    Write-Host "   ✓ Qdrant installiert nach $qdrantDir" -ForegroundColor Green
}

# 7. Installiere n8n
Write-Host ""
Write-Host "7️⃣ Installiere n8n..." -ForegroundColor Green

if (Test-Command "n8n") {
    Write-Host "   ✓ n8n bereits installiert" -ForegroundColor Green
} else {
    if (Test-Command "npm") {
        Write-Host "   Installiere n8n global via npm..." -ForegroundColor Yellow
        npm install -g n8n
        Write-Host "   ✓ n8n installiert" -ForegroundColor Green
    } else {
        Write-Host "   ✗ npm nicht gefunden! Bitte Node.js installieren." -ForegroundColor Red
    }
}

# 8. Erstelle Konfigurationsdateien
Write-Host ""
Write-Host "8️⃣ Erstelle Konfigurationsdateien..." -ForegroundColor Green

# Redis Config
$redisConfig = @"
bind 127.0.0.1
port 6379
dir $GCZ_BASE\data\redis
save 900 1
save 300 10
save 60 10000
maxmemory 2gb
maxmemory-policy allkeys-lru
"@
$redisConfig | Out-File -FilePath "$GCZ_BASE\config\redis.conf" -Encoding UTF8

# Qdrant Config
$qdrantConfig = @"
service:
  http_port: 6333
  grpc_port: 6334
  host: 0.0.0.0

storage:
  storage_path: $GCZ_BASE\data\qdrant
  on_disk_payload: true

log_level: INFO
"@
$qdrantConfig | Out-File -FilePath "$GCZ_BASE\config\qdrant.yaml" -Encoding UTF8

Write-Host "   ✓ Konfigurationsdateien erstellt" -ForegroundColor Green

# 9. Erstelle Start-Skripte
Write-Host ""
Write-Host "9️⃣ Erstelle Start-Skripte..." -ForegroundColor Green

# Start All Services Batch
$startScript = @"
@echo off
echo === Starting GermanCodeZero Services (Windows Native) ===
echo.

:: Start Ollama
echo Starting Ollama...
start "Ollama" cmd /k "ollama serve"

:: Start Redis
echo Starting Redis...
start "Redis" cmd /k "C:\tools\redis\redis-server.exe $GCZ_BASE\config\redis.conf"

:: Start Qdrant
echo Starting Qdrant...
start "Qdrant" cmd /k "$GCZ_BASE\services\qdrant\qdrant.exe --config-path $GCZ_BASE\config\qdrant.yaml"

:: Start PostgreSQL (if not running as service)
echo Checking PostgreSQL...
net start postgresql-x64-15 2>nul || echo PostgreSQL sollte als Service laufen

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
echo Alle Services gestartet!
echo.
echo Service URLs:
echo - Ollama:     http://localhost:11434
echo - Qdrant:     http://localhost:6333
echo - Redis:      localhost:6379
echo - PostgreSQL: localhost:5432
echo - n8n:        http://localhost:5678 (admin/gcz2024)
echo.
pause
"@
$startScript | Out-File -FilePath "$GCZ_BASE\start_services.bat" -Encoding ASCII

Write-Host "   ✓ Start-Skript erstellt: $GCZ_BASE\start_services.bat" -ForegroundColor Green

# 10. Kopiere .env Datei
Write-Host ""
Write-Host "🔟 Konfiguriere Environment..." -ForegroundColor Green

if (Test-Path ".env.windows") {
    Copy-Item ".env.windows" ".env" -Force
    Write-Host "   ✓ .env.windows → .env kopiert" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env.windows nicht gefunden" -ForegroundColor Yellow
}

# Abschluss
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Installation abgeschlossen!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Nächste Schritte:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Python-Umgebung aktivieren:" -ForegroundColor White
Write-Host "   venv\Scripts\activate" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Python-Dependencies installieren:" -ForegroundColor White
Write-Host "   pip install -r requirements.txt" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Services starten:" -ForegroundColor White
Write-Host "   $GCZ_BASE\start_services.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. GermanCodeZero starten:" -ForegroundColor White
Write-Host "   python main.py web" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Öffne im Browser:" -ForegroundColor White
Write-Host "   http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Viel Erfolg mit GermanCodeZero-Agent! 🚀" -ForegroundColor Magenta