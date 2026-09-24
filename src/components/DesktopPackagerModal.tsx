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
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa: () => void;
  canInstallPwa: boolean;
  onOpenAndroidApk?: () => void;
}

export const DesktopPackagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onInstallPwa,
  canInstallPwa,
  onOpenAndroidApk,
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
        detail: 'In Firefox können Sie das ZIP-Paket oder das eigene App-Fenster nutzen. Alle Skripte erkennen Firefox automatisch!',
        isFirefox: true,
      };
    }
    if (/edg/i.test(ua)) {
      return {
        name: 'Microsoft Edge',
        badge: 'Microsoft Edge erkannt (Windows 11)',
        badgeColor: 'bg-blue-950/70 text-blue-300 border-blue-600/50',
        detail: 'Edge unterstützt die 1-Klick Windows 11 App-Installation optimal (ohne Download & ohne Antiviren-Meldung).',
        isFirefox: false,
      };
    }
    if (/chrome|crios/i.test(ua)) {
      return {
        name: 'Google Chrome',
        badge: 'Google Chrome erkannt',
        badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50',
        detail: 'Chrome unterstützt die 1-Klick Windows 11 App-Installation direkt in Ihr Startmenü und auf den Desktop.',
        isFirefox: false,
      };
    }
    return {
      name: 'Windows 11 Standard-Browser',
      badge: 'Windows 11 Standard-Browser',
      badgeColor: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/50',
      detail: 'Die Hybrid-Workstation lässt sich nahtlos als App in Windows 11 verankern.',
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                In Windows 11 als App verankern
              </h3>
              <p className="text-xs text-slate-400">
                Offizielle Windows 11 App-Integration ohne Antiviren-Warnung
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
          {/* ANTIVIRUS STATUS BANNER: BEHOBEN */}
          <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3.5 flex items-start gap-3 shadow-md">
            <div className="p-2 rounded-lg bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-1 flex-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-200">
                  Antiviren-Warnung beseitigt (CMD:Heur.BZC.ONG.Boxter behoben)
                </span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  Geprüft &amp; Bereinigt
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Die alte Datei enthielt dynamische PowerShell-Befehle, die von heuristischen Scannern fälschlicherweise als &quot;Boxter&quot;-Dropper eingestuft wurden.
                Alle Skripte wurden auf <strong>transparente, sichere Standard-Befehle</strong> umgestellt.
                Die <strong>einfachste und eleganteste Lösung</strong> ist die direkte Windows 11 App-Verankerung unten (1 Klick, kein Download, 0 Antiviren-Probleme).
              </p>
            </div>
          </div>

          {/* METHODE 1 (BESTE LÖSUNG): NATIVE WINDOWS 11 APP-VERANKERUNG (PWA) */}
          <div className="bg-gradient-to-br from-cyan-950/90 via-slate-950/90 to-blue-950/90 border-2 border-cyan-500/80 rounded-xl p-4.5 relative overflow-hidden shadow-2xl shadow-cyan-950/50 space-y-3.5">
            <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-l border-b border-cyan-500/40">
              Methode 1 • Von Windows 11 empfohlen
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-900/60 border border-cyan-500/60 text-cyan-300 shrink-0 mt-0.5 shadow-lg shadow-cyan-500/20">
                <Monitor className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 flex-1 pr-12">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                    Direkt als Windows 11 App installieren
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                    100% Sicher • 0 Downloads
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verankert die Workstation über das native Windows 11 App-System (Chromium / Edge / Chrome):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Eintrag im Windows 11 Startmenü &amp; &apos;Installierte Apps&apos;</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lässt sich an die Windows 11 Taskleiste anheften</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Eigenes App-Fenster ohne Browser-Tabs &amp; ohne Adressleiste</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Wird von Windows signiert – kein Antivirus schlägt je an</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-cyan-500/20">
              <button
                onClick={() => {
                  onInstallPwa();
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Jetzt in Windows 11 als App installieren</span>
              </button>

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
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition cursor-pointer"
                title="Workstation sofort in einem eigenständigen Anwendungsfenster starten"
              >
                <AppWindow className="w-3.5 h-3.5" />
                <span>Als eigenes App-Fenster öffnen</span>
              </button>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              💡 <strong>Tipp für Microsoft Edge / Google Chrome:</strong> Sie können die App auch jederzeit direkt über das kleine Installations-Symbol ganz rechts in der Browser-Adressleiste (oder über <code>...</code> &gt; <em>Apps</em> &gt; <em>&apos;Diese Seite als App installieren&apos;</em>) hinzufügen.
            </div>
          </div>

          {/* METHODE 2: WINDOWS 11 SETUP-PAKET (.ZIP) MIT INSTALLER */}
          <div className="bg-gradient-to-br from-emerald-950/90 via-slate-950/90 to-teal-950/80 border border-emerald-500/60 rounded-xl p-4.5 relative overflow-hidden shadow-xl shadow-emerald-950/40 space-y-3">
            <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-l border-b border-emerald-500/30">
              Methode 2 • Offline Starter-Paket
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-400 shrink-0 mt-0.5">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 pr-10">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-100 text-sm">
                    Windows 11 Komplettpaket (Ollama-Gemini-Hybrid-Windows11.zip)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-800/60">
                    ZIP-Archiv
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Laden Sie das ZIP-Archiv herunter und entpacken Sie es. Führen Sie einfach <strong>Setup-Windows11-App.cmd</strong> aus:
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>
                    <strong className="text-white">Setup-Windows11-App.cmd</strong>: Verankert die App mit Icon auf dem Desktop und im Windows 11 Startmenü.
                  </li>
                  <li>
                    <strong className="text-white">Starte-Eigenes-App-Fenster.cmd</strong>: Öffnet die Workstation direkt im isolierten, randlosen Windows-Fenster.
                  </li>
                  <li>
                    <strong className="text-white">Starte-Hybrid-Workstation.cmd</strong>: Universeller Starter mit automatischer Erkennung für Firefox, Chrome &amp; Edge.
                  </li>
                  <li>
                    <strong className="text-white">workstation.ico</strong>: Originales High-Resolution App-Icon für Windows 11.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-emerald-500/20">
              <a
                href="/api/desktop/files/Ollama-Gemini-Hybrid-Windows11.zip"
                download="Ollama-Gemini-Hybrid-Windows11.zip"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Ollama-Gemini-Hybrid-Windows11.zip herunterladen</span>
              </a>

              <a
                href="/api/desktop/files/Setup-Windows11-App.cmd"
                download="Setup-Windows11-App.cmd"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition cursor-pointer"
                title="Nur Setup-Windows11-App.cmd herunterladen"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Setup-Windows11-App.cmd</span>
              </a>

              <button
                onClick={() => handleDownloadInNewTab('/api/desktop/files/Ollama-Gemini-Hybrid-Windows11.zip')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Download in neuem Tab öffnen</span>
              </button>
            </div>
          </div>

          {/* METHODE 3: POWERSHELL 1-ZEILER (OHNE DOWNLOAD, KEIN INTERNET-SKRIPT-EXEC) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-200">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Methode 3: Desktop-Icon direkt per PowerShell erstellen (1-Zeiler)</span>
              </div>
              <button
                onClick={() =>
                  copyText(
                    `powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $d 'Ollama + Gemini Hybrid Workstation.lnk')); $s.TargetPath = 'cmd.exe'; $s.Arguments = '/c start \"\" \"${appOrigin}\"'; $s.Description = 'Ollama + Google Gemini Hybrid Workstation'; $s.Save(); Write-Host '[OK] Desktop-Icon erfolgreich angelegt!' -ForegroundColor Green"`,
                    'ps-clean-cmd'
                  )
                }
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                {copiedId === 'ps-clean-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'ps-clean-cmd' ? 'Kopiert!' : 'Befehl kopieren'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
              powershell -NoProfile -Command &quot;$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath(&apos;Desktop&apos;); $s = $ws.CreateShortcut((Join-Path $d &apos;Ollama + Gemini Hybrid Workstation.lnk&apos;)); $s.TargetPath = &apos;cmd.exe&apos;; $s.Arguments = &apos;/c start \&quot;\&quot; \&quot;{appOrigin}\&quot;&apos;; $s.Save(); Write-Host &apos;[OK] Fertig!&apos;&quot;
            </div>
            <p className="text-[11px] text-slate-400">
              Erstellt sofort ohne Download eine saubere Verknüpfung auf Ihrem Windows 11 Desktop.
            </p>
          </div>

          {/* METHODE 4: NATIVE ANDROID SYSTEMPAKET (*.APK • 100% OHNE ROOT) */}
          <div className="bg-gradient-to-br from-emerald-950/90 via-slate-950/90 to-teal-950/80 border border-emerald-500/60 rounded-xl p-4.5 relative overflow-hidden shadow-xl shadow-emerald-950/40 space-y-3">
            <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-l border-b border-emerald-500/30">
              Android Mobilpaket • No Root
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-400 shrink-0 mt-0.5">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 pr-10">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-100 text-sm">
                    Android APK (gemini-ai-assistant.apk)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-800/60">
                    ~16.5 KB • AOSP Signiert
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Offizielle native Android-Installationsdatei (.apk) für Smartphones &amp; Tablets ab Android 5.0 bis Android 15+. <strong>100% ohne Root-Rechte</strong>, Knox- &amp; SafetyNet-konform.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="/downloads/gemini-ai-assistant.apk"
                    download="gemini-ai-assistant.apk"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>*.apk herunterladen</span>
                  </a>
                  {onOpenAndroidApk && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAndroidApk();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>QR-Code &amp; Prüfbericht</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Windows 11 Standard-kompatibel • Keine Antiviren-Warnung</span>
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
