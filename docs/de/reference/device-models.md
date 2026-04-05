---
read_when:
    - Aktualisieren von Zuordnungen für Gerätemodellkennungen oder NOTICE-/Lizenzdateien
    - Ändern der Anzeige von Gerätenamen in der Instances-Benutzeroberfläche
summary: Wie OpenClaw Apple-Gerätemodellkennungen für benutzerfreundliche Namen in der macOS-App vendort.
title: Gerätemodell-Datenbank
x-i18n:
    generated_at: "2026-04-05T12:54:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Gerätemodell-Datenbank (benutzerfreundliche Namen)

Die macOS-Begleit-App zeigt in der **Instances**-Benutzeroberfläche benutzerfreundliche Apple-Gerätemodellnamen an, indem Apple-Modellkennungen (z. B. `iPad16,6`, `Mac16,6`) menschenlesbaren Namen zugeordnet werden.

Die Zuordnung wird als JSON unter folgendem Pfad vendort:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Datenquelle

Derzeit vendoren wir die Zuordnung aus dem MIT-lizenzierten Repository:

- `kyle-seongwoo-jun/apple-device-identifiers`

Damit Builds deterministisch bleiben, sind die JSON-Dateien auf bestimmte Upstream-Commits fixiert (dokumentiert in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Aktualisieren der Datenbank

1. Wählen Sie die Upstream-Commits aus, auf die Sie fixieren möchten (einen für iOS, einen für macOS).
2. Aktualisieren Sie die Commit-Hashes in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Laden Sie die JSON-Dateien erneut herunter, fixiert auf diese Commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Stellen Sie sicher, dass `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` weiterhin mit dem Upstream übereinstimmt (ersetzen Sie die Datei, wenn sich die Upstream-Lizenz ändert).
5. Vergewissern Sie sich, dass die macOS-App sauber gebaut wird (ohne Warnungen):

```bash
swift build --package-path apps/macos
```
