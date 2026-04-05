---
read_when:
    - Erfassen von macOS-Logs oder Untersuchen der Protokollierung privater Daten
    - Debuggen von Voice-Wake-/Sitzungslebenszyklus-Problemen
summary: 'OpenClaw-Protokollierung: rollierende Diagnosedatei-Logs + Unified-Logging-Privacy-Flags'
title: macOS-Protokollierung
x-i18n:
    generated_at: "2026-04-05T12:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Protokollierung (macOS)

## Rollierendes Diagnosedatei-Log (Debug-Bereich)

OpenClaw leitet macOS-App-Logs über swift-log weiter (standardmäßig Unified Logging) und kann ein lokales, rotierendes Dateilog auf die Festplatte schreiben, wenn Sie eine dauerhafte Erfassung benötigen.

- Ausführlichkeit: **Debug-Bereich → Logs → App logging → Verbosity**
- Aktivieren: **Debug-Bereich → Logs → App logging → „Write rolling diagnostics log (JSONL)”**
- Speicherort: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotiert automatisch; alte Dateien erhalten die Suffixe `.1`, `.2`, …)
- Leeren: **Debug-Bereich → Logs → App logging → „Clear”**

Hinweise:

- Dies ist **standardmäßig deaktiviert**. Aktivieren Sie es nur, wenn Sie aktiv debuggen.
- Behandeln Sie die Datei als sensibel; teilen Sie sie nicht ohne Prüfung.

## Private Daten im Unified Logging unter macOS

Unified Logging redigiert die meisten Nutzlasten, sofern sich ein Subsystem nicht mit `privacy -off` dafür anmeldet. Laut Peters Beitrag zu macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) wird dies durch eine plist unter `/Library/Preferences/Logging/Subsystems/` gesteuert, die nach dem Namen des Subsystems benannt ist. Nur neue Logeinträge übernehmen dieses Flag, aktivieren Sie es also, bevor Sie ein Problem reproduzieren.

## Für OpenClaw aktivieren (`ai.openclaw`)

- Schreiben Sie die plist zuerst in eine temporäre Datei und installieren Sie sie dann atomar als Root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Ein Neustart ist nicht erforderlich; `logd` bemerkt die Datei schnell, aber nur neue Logzeilen enthalten private Nutzlasten.
- Sehen Sie sich die detailliertere Ausgabe mit dem vorhandenen Helper an, z. B. `./scripts/clawlog.sh --category WebChat --last 5m`.

## Nach dem Debuggen deaktivieren

- Entfernen Sie die Überschreibung: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Optional `sudo log config --reload` ausführen, um `logd` zu zwingen, die Überschreibung sofort zu verwerfen.
- Denken Sie daran, dass diese Oberfläche Telefonnummern und Nachrichtentexte enthalten kann; lassen Sie die plist nur so lange an Ort und Stelle, wie Sie die zusätzlichen Details aktiv benötigen.
