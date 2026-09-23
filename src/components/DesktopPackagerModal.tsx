import React, { useState } from 'react';
import {
  X,
  Download,
  Terminal,
  Copy,
  Check,
  Package,
  Monitor,
  ExternalLink,
  ShieldCheck,
  FolderArchive,
  Compass,
  CheckCircle2,
  AppWindow,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa: () => void;
  canInstallPwa: boolean;
}

export const DesktopPackagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onInstallPwa,
  canInstallPwa,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadInNewTab = (filePath: string) => {
    window.open(filePath, '_blank');
  };

  const detectBrowserInfo = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    if (/firefox|fxios/i.test(ua)) {
      return {
        name: 'Mozilla Firefox',
        badge: 'Mozilla Firefox erkannt 🦊',
        badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
        detail: 'Perfekt konfiguriert: Alle Starter-Skripte erkennen Firefox automatisch und öffnen ein aufgeräumtes Einzelfenster (-new-window). Microsoft Edge wird nicht benötigt!',
        isFirefox: true,
      };
    }
    if (/edg/i.test(ua)) {
      return {
        name: 'Microsoft Edge',
        badge: 'Microsoft Edge erkannt',
        badgeColor: 'bg-blue-950/70 text-blue-300 border-blue-600/50',
        detail: 'Edge wird im nativen Desktop-App-Fenster (--app) gestartet.',
        isFirefox: false,
      };
    }
    if (/chrome|crios/i.test(ua)) {
      return {
        name: 'Google Chrome',
        badge: 'Google Chrome erkannt',
        badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50',
        detail: 'Chrome wird im nativen Desktop-App-Fenster (--app) gestartet.',
        isFirefox: false,
      };
    }
    if (/brave/i.test(ua)) {
      return {
        name: 'Brave Browser',
        badge: 'Brave Browser erkannt',
        badgeColor: 'bg-orange-950/70 text-orange-300 border-orange-600/50',
        detail: 'Brave wird im nativen Desktop-App-Fenster (--app) gestartet.',
        isFirefox: false,
      };
    }
    return {
      name: 'Windows Standard-Browser',
      badge: 'Windows 11 Standard-Browser',
      badgeColor: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/50',
      detail: 'Automatische Browser-Erkennung aktiv: Die Workstation öffnet sich automatisch in Ihrem in Windows hinterlegten Standard-Browser (z. B. Firefox).',
      isFirefox: false,
    };
  };

  const browserInfo = detectBrowserInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Windows 11 Desktop-Bereitstellung &amp; Browser-Starter
              </h3>
              <p className="text-xs text-slate-400">
                Automatische Erkennung für Firefox, Chrome, Brave &amp; Windows-Standard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-sm">
          {/* 1. VOLLAUTOMATISCHER WINDOWS 11 1-KLICK INSTALLER MIT DESKTOP-ICON */}
          <div className="bg-gradient-to-br from-cyan-950/90 via-slate-950/90 to-blue-950/90 border-2 border-cyan-500/80 rounded-xl p-4.5 relative overflow-hidden shadow-2xl shadow-cyan-950/50 space-y-3.5">
            <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-l border-b border-cyan-500/40">
              Windows 11 • Desktop-Icon &amp; Startmenü
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-900/60 border border-cyan-500/60 text-cyan-300 shrink-0 mt-0.5 shadow-lg shadow-cyan-500/20">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 flex-1 pr-12">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                    Windows 11 1-Klick Installer (Vollautomatischer Block)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/60">
                    Mit App-Icon (.ico)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Installiert die gesamte Hybrid Workstation mit einem einzigen Klick als eigenständigen Anwendungsblock in Windows 11:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Desktop-Icon mit offiziellem App-Logo (.ico)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Eintrag im Windows 11 Startmenü</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Automatischer Start von Ollama &amp; Qwen-Decider</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Öffnet im randlosen App-Fenster (ohne URL-Leiste)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-cyan-500/20">
              <a
                href="/api/desktop/files/Install-Windows11-App.bat"
                download="Install-Windows11-App.bat"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition cursor-pointer"
                title="Herunterladen und per Doppelklick ausfuehren"
              >
                <Download className="w-4 h-4" />
                <span>1. Install-Windows11-App.bat herunterladen</span>
              </a>

              <a
                href="/api/desktop/files/Setup-Qwen-Modell.bat"
                download="Setup-Qwen-Modell.bat"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                title="Behebt 'file does not exist' in Ollama mit 1 Klick"
              >
                <Download className="w-3.5 h-3.5" />
                <span>2. Setup-Qwen-Modell.bat herunterladen</span>
              </a>

              <a
                href="/api/desktop/files/workstation.ico"
                download="workstation.ico"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Windows Icon (.ico) separat herunterladen"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>workstation.ico</span>
              </a>

              <button
                onClick={() =>
                  copyText(
                    `powershell -NoProfile -Command "$w = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s = $w.CreateShortcut((Join-Path $d 'Ollama + Gemini Hybrid Workstation.lnk')); $s.TargetPath = 'cmd.exe'; $s.Arguments = '/c start \"\" \"${appOrigin}\"'; $s.Save(); Write-Host '[OK] Desktop-Icon erfolgreich angelegt!' -ForegroundColor Green"`,
                    'ps-auto-install'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono border border-cyan-500/40 transition cursor-pointer ml-auto"
                title="Direkter 1-Zeiler fuer PowerShell (benoetigt keinen Download)"
              >
                {copiedId === 'ps-auto-install' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedId === 'ps-auto-install' ? 'Befehl kopiert!' : 'PowerShell Direkt-Icon (1-Zeiler)'}
                </span>
              </button>
            </div>

            {/* Explanatory banner for the user's specific errors */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-cyan-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-[11px]">
                <span>💡 Wichtige Loesung fuer die beiden Fehlermeldungen:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">1. &quot;irm / Verbindung fehlgeschlagen&quot;</div>
                  <p className="text-slate-400 leading-relaxed">
                    Externe PowerShell-Downloads ins Internet werden durch Cloud-Sicherheitschecks gebremst. 
                    <strong className="text-slate-200"> Loesung:</strong> Klicken Sie oben einfach auf den blauen Button <span className="text-cyan-300">Install-Windows11-App.bat</span> und fuehren Sie die Datei mit Doppelklick aus. Das App-Icon ist jetzt direkt im Skript eingebettet (100% autark &amp; lokal).
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="font-bold text-violet-300">2. &quot;pull model manifest: file does not exist&quot;</div>
                  <p className="text-slate-400 leading-relaxed">
                    Im offiziellen Ollama-Katalog heisst das Modell <strong className="text-violet-200">qwen2.5:0.5b</strong> (mit &quot;2.5&quot;). 
                    <strong className="text-slate-200"> Loesung:</strong> Klicken Sie oben auf <span className="text-violet-300">Setup-Qwen-Modell.bat</span> oder fuehren Sie aus: 
                    <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded block mt-1 font-mono">ollama pull qwen2.5:0.5b &amp;&amp; ollama cp qwen2.5:0.5b qwen-decider:0.5b</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BROWSER AUTO-DETECTION BANNER */}
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3.5 flex items-start gap-3 shadow-md">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-xs text-slate-200">
                  Automatische Browser-Erkennung aktiv:
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${browserInfo.badgeColor}`}
                >
                  {browserInfo.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {browserInfo.detail}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Kein Edge erforderlich
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Windows Registry &amp; PATH Abfrage
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Natives Firefox-Fenster (-new-window)
                </span>
              </div>
            </div>
          </div>

          {/* SOFORTIGES EIGENES APP-FENSTER (1-KLICK OHNE DOWNLOAD) */}
          <div className="bg-gradient-to-br from-indigo-950/90 via-slate-950/90 to-blue-950/80 border-2 border-indigo-500/60 rounded-xl p-4.5 relative overflow-hidden shadow-xl shadow-indigo-950/40 space-y-3">
            <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-l border-b border-indigo-500/30">
              Sofort-Modus • Ohne Download
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-indigo-900/60 border border-indigo-700/60 text-indigo-400 shrink-0 mt-0.5">
                <AppWindow className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 pr-10">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-100 text-sm">
                    Eigene UI im eigenen Fenster starten
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-800/60">
                    Standalone Popout
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Öffnet die Workstation sofort in einem <strong>isolierten, eigenständigen Anwendungsfenster</strong> ohne Browser-Tabs, ohne Menüleiste und ohne Adresszeile.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-indigo-500/20">
              <button
                onClick={() => {
                  const width = Math.min(1440, window.screen.availWidth - 40);
                  const height = Math.min(920, window.screen.availHeight - 60);
                  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
                  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
                  const win = window.open(
                    window.location.href,
                    'HybridWorkstationDedicatedApp',
                    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,directories=no,scrollbars=yes,resizable=yes`
                  );
                  if (win) {
                    win.focus();
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                <AppWindow className="w-4 h-4" />
                <span>Jetzt eigenes Fenster öffnen</span>
              </button>
            </div>
          </div>

          {/* METHODE 1: ZIP-KOMPLETTPAKET MIT AUTOMATISCHER BROWSER-ERKENNUNG */}
          <div className="bg-gradient-to-br from-emerald-950/90 via-slate-950/90 to-teal-950/80 border border-emerald-500/60 rounded-xl p-4.5 relative overflow-hidden shadow-xl shadow-emerald-950/40 space-y-3">
            <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-l border-b border-emerald-500/30">
              Windows 11 Starter-Paket
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-400 shrink-0 mt-0.5">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 pr-10">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-100 text-sm">
                    Windows 11 Komplettpaket (Ollama-Gemini-Hybrid.zip)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-800/60">
                    ZIP-Archiv
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enthält native Startskripte inklusive <strong>Eigenes-Fenster-Starter</strong> und Firefox-Erkennung:
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>
                    <strong className="text-white">Starte-Eigenes-App-Fenster.cmd</strong>: Öffnet die Workstation in einem isolierten, randlosen Windows-Fenster ohne Browser-Tabs und ohne URL-Leiste.
                  </li>
                  <li>
                    <strong className="text-white">Ollama-Workstation.hta</strong>: Natives Windows 11 HTML-Anwendungsfenster (MSHTA).
                  </li>
                  <li>
                    <strong className="text-white">Starte-Hybrid-Workstation.cmd</strong>: Universeller Starter mit automatischer Erkennung für Firefox, Chrome &amp; Edge.
                  </li>
                  <li>
                    <strong className="text-white">Installiere-Desktop-Icon.cmd</strong>: Richtet vollautomatisch das Desktop-Icon auf Windows 11 ein.
                  </li>
                  <li>
                    <strong className="text-white">Sync-Laufwerk-D.cmd</strong>: Sichere Offline-Synchronisation nach <code className="text-emerald-300 font-mono">D:\OllamaKnowledge</code>.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-emerald-500/20">
              <a
                href="/api/desktop/files/Ollama-Gemini-Hybrid.zip"
                download="Ollama-Gemini-Hybrid.zip"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Ollama-Gemini-Hybrid.zip herunterladen</span>
              </a>

              <a
                href="/api/desktop/files/Starte-Eigenes-App-Fenster.cmd"
                download="Starte-Eigenes-App-Fenster.cmd"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition cursor-pointer"
                title="Nur Starte-Eigenes-App-Fenster.cmd herunterladen"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Starte-Eigenes-App-Fenster.cmd</span>
              </a>

              <button
                onClick={() => handleDownloadInNewTab('/api/desktop/files/Ollama-Gemini-Hybrid.zip')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition cursor-pointer"
                title="Öffnet den Download in einem neuen Tab, falls Ihr Browser Downloads in der Vorschau blockiert"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>In neuem Tab herunterladen</span>
              </button>
            </div>
          </div>

          {/* METHODE 2: NATIVE WINDOWS 11 PWA (OHNE DOWNLOAD) */}
          <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-4 relative overflow-hidden space-y-3">
            <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg border-l border-b border-cyan-500/30">
              Kein Download erforderlich
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400 shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1 pr-12">
                <h4 className="font-semibold text-slate-100 text-sm">
                  Als native Windows 11 App verankern (PWA)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Installiert die Anwendung mit 1 Klick direkt in Ihr Windows 11 Startmenü und auf die Taskleiste. Läuft als randlose Desktop-App unabhängig von Browser-Tabs.
                </p>
                <div className="pt-1">
                  <button
                    onClick={onInstallPwa}
                    disabled={!canInstallPwa}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>{canInstallPwa ? 'Jetzt als Desktop-App installieren' : 'Bereits in Windows installiert'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* METHODE 3: POWERSHELL 1-KLICK TERMINAL BEFEHL */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-200">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Windows 11 Terminal 1-Zeiler (Automatische Browser-Erkennung)</span>
              </div>
              <button
                onClick={() =>
                  copyText(
                    `powershell -ExecutionPolicy Bypass -Command "$u='${appOrigin}';$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\\Ollama + Gemini Hybrid.lnk');$ff=(Get-Command firefox.exe -ErrorAction SilentlyContinue).Source;if(-not $ff -and (Test-Path 'C:\\Program Files\\Mozilla Firefox\\firefox.exe')){$ff='C:\\Program Files\\Mozilla Firefox\\firefox.exe'};if($ff){$s.TargetPath=$ff;$s.Arguments='-new-window '+$u}else{$s.TargetPath='cmd.exe';$s.Arguments='/c start \"\" '+$u};$s.Save();Write-Host 'Erfolgreich! Desktop-Icon fuer Ihren Browser angelegt.' -ForegroundColor Green"`,
                    'ps-cmd'
                  )
                }
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                {copiedId === 'ps-cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'ps-cmd' ? 'Kopiert!' : 'Befehl kopieren'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
              powershell -ExecutionPolicy Bypass -Command &quot;irm {appOrigin}/api/desktop/files/install.ps1 | iex&quot;
            </div>
            <p className="text-[11px] text-slate-400">
              Führen Sie diese Zeile in der Windows PowerShell aus. Sie ermittelt automatisch, ob <strong>Firefox</strong>, Chrome oder ein anderer Browser Ihr Standard ist, und erstellt die passende Desktop-Verknüpfung.
            </p>
          </div>

          {/* METHODE 4: EINZELDATEIEN (CMD & PS1) */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Alternative Einzel-Dateien:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="/api/desktop/files/Start-Hybrid-Workstation.cmd"
                download="Start-Hybrid-Workstation.cmd"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs transition group"
              >
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-200 group-hover:text-cyan-300">
                    Start-Hybrid-Workstation.cmd
                  </div>
                  <div className="text-[10px] text-slate-400">Mit Firefox- &amp; Standard-Erkennung</div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
              </a>

              <a
                href="/api/desktop/files/install.ps1"
                download="install.ps1"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs transition group"
              >
                <div>
                  <div className="font-mono text-[11px] font-bold text-slate-200 group-hover:text-cyan-300">
                    install.ps1
                  </div>
                  <div className="text-[10px] text-slate-400">PowerShell Auto-Browser Setup</div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Windows 11 SmartScreen, Firefox &amp; DirectML kompatibel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

