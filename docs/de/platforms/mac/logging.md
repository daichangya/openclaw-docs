---
read_when:
    - macOS-Logs erfassen oder Logging privater Daten untersuchen
    - Voice-Wake-/Sitzungslebenszyklus-Probleme debuggen
summary: 'OpenClaw-Logging: rotierendes Diagnostik-Dateilog + Datenschutz-Flags für das Unified Log'
title: macOS-Logging
x-i18n:
    generated_at: "2026-04-24T06:47:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## Rotierendes Diagnostik-Dateilog (Debug-Bereich)

OpenClaw leitet Logs der macOS-App über swift-log weiter (standardmäßig an Unified Logging) und kann ein lokales, rotierendes Dateilog auf die Festplatte schreiben, wenn Sie eine dauerhafte Aufzeichnung benötigen.

- Ausführlichkeit: **Debug pane → Logs → App logging → Verbosity**
- Aktivieren: **Debug pane → Logs → App logging → „Write rolling diagnostics log (JSONL)”**
- Speicherort: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotiert automatisch; alte Dateien erhalten Suffixe wie `.1`, `.2`, …)
- Löschen: **Debug pane → Logs → App logging → „Clear”**

Hinweise:

- Dies ist standardmäßig **deaktiviert**. Aktivieren Sie es nur während aktiver Fehlersuche.
- Behandeln Sie die Datei als sensibel; teilen Sie sie nicht ohne Prüfung.

## Private Daten im Unified Logging auf macOS

Unified Logging redigiert die meisten Payloads, sofern sich ein Subsystem nicht mit `privacy -off` dafür entscheidet. Laut Peters Beitrag zu macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) wird dies durch eine plist unter `/Library/Preferences/Logging/Subsystems/` gesteuert, die nach dem Namen des Subsystems verschlüsselt ist. Nur neue Log-Einträge übernehmen das Flag, daher sollten Sie es aktivieren, bevor Sie ein Problem reproduzieren.

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

- Kein Neustart ist erforderlich; logd bemerkt die Datei schnell, aber nur neue Log-Zeilen enthalten private Payloads.
- Zeigen Sie die detailreichere Ausgabe mit dem vorhandenen Helper an, z. B. `./scripts/clawlog.sh --category WebChat --last 5m`.

## Nach dem Debugging deaktivieren

- Entfernen Sie das Override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Optional können Sie `sudo log config --reload` ausführen, um logd zu zwingen, das Override sofort zu verwerfen.
- Denken Sie daran, dass diese Oberfläche Telefonnummern und Nachrichteninhalte enthalten kann; lassen Sie die plist nur so lange aktiv, wie Sie die zusätzlichen Details wirklich benötigen.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Gateway-Logging](/de/gateway/logging)
