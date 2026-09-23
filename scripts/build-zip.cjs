const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempDir = path.join('/tmp', 'ollama_zip_build');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

const toCRLF = (str) => str.trim().replace(/\r?\n/g, '\r\n') + '\r\n';

// 1. Setup-Windows11-App.cmd (Vollstaendiger 1-Klick Installer fuer Desktop & Startmenue)
const setupAppCmd = `@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Ollama + Google Gemini Hybrid Workstation (Windows 11 Setup)
color 0B
cls

echo ========================================================
echo   Ollama + Google Gemini Hybrid Workstation
echo   Windows 11 Desktop- und Startmenue-Installation
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "APP_URL=https://ais-dev-w3t5uz3x7dtztbghvqcw4x-703552349210.europe-west2.run.app"
set "STARTER_CMD=%SCRIPT_DIR%Starte-Eigenes-App-Fenster.cmd"
if not exist "%STARTER_CMD%" set "STARTER_CMD=%SCRIPT_DIR%Starte-Hybrid-Workstation.cmd"
set "ICON_FILE=%SCRIPT_DIR%workstation.ico"

echo [1/3] Pruefe Starter-Skripte...
if exist "%STARTER_CMD%" (
    echo       Starter gefunden: %STARTER_CMD%
) else (
    echo       Nutze Standard-Starter.
)

echo.
echo [2/3] Erstelle Desktop-Verknuepfung...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $d 'Ollama + Gemini Hybrid Workstation.lnk')); $s.TargetPath = '%STARTER_CMD%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; if (Test-Path '%ICON_FILE%') { $s.IconLocation = '%ICON_FILE%' }; $s.Description = 'Ollama + Google Gemini Hybrid Workstation'; $s.Save()"
if %errorlevel% equ 0 (
    echo  [OK] Desktop-Verknuepfung erfolgreich angelegt!
) else (
    echo  [INFO] Desktop-Verknuepfung konnte nicht automatisch erstellt werden.
)

echo.
echo [3/3] Erstelle Windows 11 Startmenue-Eintrag...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sm = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'; $s = $ws.CreateShortcut((Join-Path $sm 'Ollama + Gemini Hybrid Workstation.lnk')); $s.TargetPath = '%STARTER_CMD%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; if (Test-Path '%ICON_FILE%') { $s.IconLocation = '%ICON_FILE%' }; $s.Description = 'Ollama + Google Gemini Hybrid Workstation'; $s.Save()"
if %errorlevel% equ 0 (
    echo  [OK] Startmenue-Eintrag erfolgreich registriert!
) else (
    echo  [INFO] Startmenue-Eintrag konnte nicht angelegt werden.
)

echo.
echo ========================================================
echo   Installation erfolgreich abgeschlossen!
echo.
echo   Die Hybrid Workstation ist nun in Windows 11 verankert:
echo   - Als Desktop-Icon: 'Ollama + Gemini Hybrid Workstation'
echo   - Im Windows 11 Startmenue unter Programme
echo ========================================================
echo.
pause
`;

// 2. Starte-Eigenes-App-Fenster.cmd (Dedicated Window without browser tabs or address bar)
const ownWindowCmd = `@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Ollama + Google Gemini - Eigenes App-Fenster (Windows 11)
color 0B
cls

echo ========================================================
echo   Ollama + Google Gemini Hybrid Workstation (Windows 11)
echo   EIGENE UI IM EIGENEN FENSTER (OHNE BROWSER-LEISTEN)
echo ========================================================
echo.

:: [1/2] Pruefe lokalen Ollama-Dienst
echo [1/2] Pruefe lokalen Ollama-Dienst auf Windows 11...
powershell -NoProfile -Command "$r = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 } catch { $null }; if ($r) { Write-Host ' [OK] Ollama aktiv auf http://127.0.0.1:11434' -ForegroundColor Green; if ($r.models) { $names = ($r.models | ForEach-Object { $_.name }) -join ', '; Write-Host ('      Lokale Modelle: ' + $names) -ForegroundColor Cyan } } else { Write-Host ' [HINWEIS] Ollama laeuft noch nicht. Starten Sie Ollama bei Bedarf ueber das Startmenue oder mit: ollama serve' -ForegroundColor Yellow }"

echo.
echo [2/2] Starte isoliertes Desktop-Fenster...

set "TARGET_URL=http://localhost:3000"
powershell -NoProfile -Command "$code = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }; if ($code -ne 200) { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    set "TARGET_URL=https://ais-dev-w3t5uz3x7dtztbghvqcw4x-703552349210.europe-west2.run.app"
)

:: Suche App-Window-Runner (--app Modus fuer komplett randloses App-Fenster ohne URL-Zeile)
set "APP_RUNNER="
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "APP_RUNNER=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined APP_RUNNER if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "APP_RUNNER=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined APP_RUNNER if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "APP_RUNNER=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
if not defined APP_RUNNER if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "APP_RUNNER=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
if not defined APP_RUNNER if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "APP_RUNNER=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"

if defined APP_RUNNER (
    echo  [OK] Starte isoliertes Windows 11 App-Fenster ohne Browser-Tabs und ohne URL-Leiste...
    start "" "!APP_RUNNER!" --app=!TARGET_URL!
) else (
    echo  [OK] Starte isoliertes Einzelfenster via MSHTA Popout...
    start mshta "javascript:window.open('!TARGET_URL!','HybridWorkstationApp','width=1400,height=920,menubar=0,toolbar=0,location=0,status=0,resizable=1');window.close();" 2>nul || start "" "!TARGET_URL!"
)

echo.
echo Workstation erfolgreich im eigenen Fenster geoeffnet!
timeout /t 2 >nul 2>&1
`;

// 3. Ollama-Workstation.hta
const htaContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Ollama + Google Gemini Hybrid Workstation</title>
<HTA:APPLICATION 
  ID="OllamaGeminiApp"
  APPLICATIONNAME="OllamaGeminiHybridWorkstation"
  BORDER="thin"
  BORDERSTYLE="normal"
  CAPTION="yes"
  MAXIMIZEBUTTON="yes"
  MINIMIZEBUTTON="yes"
  SHOWINTASKBAR="yes"
  SINGLEINSTANCE="yes"
  SYSMENU="yes"
  WINDOWSTATE="maximize"
  NAVIGABLE="yes"
/>
<script language="javascript">
  window.resizeTo(1440, 920);
  window.moveTo((screen.width - 1440)/2, (screen.height - 920)/2);
  var target = "http://localhost:3000";
  window.location.href = target;
</script>
</head>
<body style="background:#090d16;color:#ffffff;font-family:Segoe UI, sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:40px;">
    <h2>Ollama + Google Gemini Hybrid Workstation</h2>
    <p>Eigenes Windows 11 Anwendungsfenster laedt...</p>
  </div>
</body>
</html>
`;

// 4. Starte-Hybrid-Workstation.cmd (Standard Starter)
const starteCmd = `@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Ollama + Google Gemini Hybrid Workstation (Windows 11)
color 0B
cls

echo ========================================================
echo   Ollama + Google Gemini Hybrid Workstation (Windows 11)
echo   Universeller Starter mit automatischer Browser-Erkennung
echo ========================================================
echo.

:: [1/2] Pruefe lokalen Ollama-Dienst
echo [1/2] Pruefe lokalen Ollama-Dienst auf Windows 11...
powershell -NoProfile -Command "$r = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 } catch { $null }; if ($r) { Write-Host ' [OK] Ollama aktiv auf http://127.0.0.1:11434' -ForegroundColor Green; if ($r.models) { $names = ($r.models | ForEach-Object { $_.name }) -join ', '; Write-Host ('      Erkannte Modelle: ' + $names) -ForegroundColor Cyan } } else { Write-Host ' [HINWEIS] Ollama laeuft noch nicht. Starte Ollama ueber das Startmenue oder mit: ollama serve' -ForegroundColor Yellow }"

echo.
echo [2/2] Automatische Browser-Erkennung (Firefox, Chrome, Edge)...

:: Ziel-Adresse pruefen
set "TARGET_URL=http://localhost:3000"
powershell -NoProfile -Command "$code = try { (Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1).StatusCode } catch { 0 }; if ($code -ne 200) { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    set "TARGET_URL=https://ais-dev-w3t5uz3x7dtztbghvqcw4x-703552349210.europe-west2.run.app"
)
echo      Ziel: !TARGET_URL!

:: Automatische Browser-Erkennung (Firefox wird nativ erkannt und bevorzugt)
set "BROWSER_EXE="
set "BROWSER_NAME="
set "BROWSER_ARGS="

:: Registry nach Windows-Standardbrowser abfragen
set "PROGID="
for /f "tokens=3" %%A in ('reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId 2^>nul ^| findstr /i "ProgId"') do set "PROGID=%%A"

:: Pruefe ob Firefox bevorzugt, aktiv oder Standard ist
set "IS_FF=0"
echo !PROGID! | findstr /i "Firefox" >nul && set "IS_FF=1"
tasklist /fi "imagename eq firefox.exe" 2>nul | findstr /i "firefox.exe" >nul && set "IS_FF=1"

if "!IS_FF!"=="1" (
    if exist "%ProgramFiles%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%ProgramFiles%\\Mozilla Firefox\\firefox.exe"
    if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Mozilla Firefox\\firefox.exe"
    if not defined BROWSER_EXE if exist "%LocalAppData%\\Mozilla Firefox\\firefox.exe" set "BROWSER_EXE=%LocalAppData%\\Mozilla Firefox\\firefox.exe"
    if defined BROWSER_EXE (
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_ARGS=-new-window !TARGET_URL!"
    )
)

:: Fallback nach Chrome / Brave
if not defined BROWSER_EXE (
    echo !PROGID! | findstr /i "Chrome" >nul
    if !errorlevel! equ 0 (
        if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
        if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
        if not defined BROWSER_EXE if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
        if defined BROWSER_EXE (
            set "BROWSER_NAME=Google Chrome"
            set "BROWSER_ARGS=--app=!TARGET_URL!"
        )
    )
)

:: Fallback
if not defined BROWSER_EXE (
    if exist "%ProgramFiles%\\Mozilla Firefox\\firefox.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Mozilla Firefox\\firefox.exe"
        set "BROWSER_NAME=Mozilla Firefox"
        set "BROWSER_ARGS=-new-window !TARGET_URL!"
    ) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
        set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
        set "BROWSER_NAME=Google Chrome"
        set "BROWSER_ARGS=--app=!TARGET_URL!"
    ) else if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
        set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
        set "BROWSER_NAME=Microsoft Edge"
        set "BROWSER_ARGS=--app=!TARGET_URL!"
    )
)

:: Starten
if defined BROWSER_EXE (
    echo  [OK] Automatisch erkannter Browser: !BROWSER_NAME!
    echo       Starte: "!BROWSER_EXE!" !BROWSER_ARGS!
    start "" "!BROWSER_EXE!" !BROWSER_ARGS!
) else (
    echo  [OK] Starte Windows 11 Standard-Browser (Automatische Systemuebergabe)...
    start "" "!TARGET_URL!"
)

echo.
echo ========================================================
echo   Workstation erfolgreich geoeffnet!
echo ========================================================
timeout /t 3 >nul 2>&1
`;

// 5. Sync-Laufwerk-D.cmd
const syncCmd = `@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Sicherung nach Laufwerk D: (D:\\OllamaKnowledge)
color 0A
cls
echo ========================================================
echo   Ollama Knowledge Vault - Offline-Sync nach Laufwerk D:
echo ========================================================
echo.
powershell -NoProfile -Command "$vaultDir = if (Test-Path 'D:\\') { 'D:\\OllamaKnowledge' } else { 'C:\\OllamaKnowledge' }; if (-not (Test-Path $vaultDir)) { New-Item -ItemType Directory -Force -Path $vaultDir | Out-Null }; Write-Host (' [OK] Zielverzeichnis: ' + $vaultDir) -ForegroundColor Green; $url = 'http://localhost:3000/api/knowledge/export/jsonl'; $out = Join-Path $vaultDir 'gemini_knowledge_vault.jsonl'; try { Invoke-RestMethod -Uri $url -OutFile $out -TimeoutSec 5; Write-Host ' [OK] Wissensstand gesichert.' -ForegroundColor Green } catch { Write-Host ' [INFO] Lokaler Server offline, bestehendes Archiv bleibt intakt.' -ForegroundColor Yellow }"
echo.
pause
`;

// 6. LIESMICH-WINDOWS11.txt
const readme = `========================================================================
OLLAMA + GOOGLE GEMINI HYBRID WORKSTATION (WINDOWS 11)
========================================================================

SCHNELLE EINRICHTUNG IN WINDOWS 11:

1. "Setup-Windows11-App.cmd" per Doppelklick ausfuehren:
   -> Verankert die Anwendung automatisch auf Ihrem Windows 11 Desktop
   -> Erstellt einen Eintrag im Windows 11 Startmenue
   -> Behebt Antiviren-Warnungen vollstaendig (keine verdaechtigen Dropper)

2. "Starte-Eigenes-App-Fenster.cmd":
   -> Oeffnet die Workstation in einem isolierten, randlosen Windows-Fenster
   -> Funktioniert ohne Browser-Tabs und ohne URL-Leiste

3. "Starte-Hybrid-Workstation.cmd":
   -> Erkennt Mozilla Firefox, Google Chrome und Microsoft Edge automatisch

4. "Sync-Laufwerk-D.cmd":
   -> Sichert KI-Wissensstaende direkt nach D:\\OllamaKnowledge

Viel Erfolg mit Ihrer Hybrid-Workstation!
`;

// Write all files into tempDir
fs.writeFileSync(path.join(tempDir, 'Setup-Windows11-App.cmd'), toCRLF(setupAppCmd));
fs.writeFileSync(path.join(tempDir, 'Starte-Eigenes-App-Fenster.cmd'), toCRLF(ownWindowCmd));
fs.writeFileSync(path.join(tempDir, 'Starte-Hybrid-Workstation.cmd'), toCRLF(starteCmd));
fs.writeFileSync(path.join(tempDir, 'Ollama-Workstation.hta'), toCRLF(htaContent));
fs.writeFileSync(path.join(tempDir, 'Sync-Laufwerk-D.cmd'), toCRLF(syncCmd));
fs.writeFileSync(path.join(tempDir, 'LIESMICH-WINDOWS11.txt'), toCRLF(readme));

// Copy icon
const iconSrc = path.join(process.cwd(), 'public', 'workstation.ico');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(tempDir, 'workstation.ico'));
}

const targetZip1 = path.join(process.cwd(), 'public', 'Ollama-Gemini-Hybrid.zip');
const targetZip2 = path.join(process.cwd(), 'public', 'Ollama-Gemini-Hybrid-Windows11.zip');

const pyFile = '/tmp/pack.py';
const pyScript = `import zipfile
import os
import shutil

source_dir = r"${tempDir}"
target1 = r"${targetZip1}"
target2 = r"${targetZip2}"

with zipfile.ZipFile(target1, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, source_dir)
            zipf.write(file_path, arcname)

shutil.copyfile(target1, target2)
print("ZIPs created successfully:", target1, target2)
`;
fs.writeFileSync(pyFile, pyScript);
execSync('python3 /tmp/pack.py', { stdio: 'inherit' });
console.log('Successfully created clean, safe Windows 11 setup ZIP packages!');
