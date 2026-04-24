---
read_when:
    - Zuordnungen von Gerätemodellkennungen oder NOTICE-/Lizenzdateien aktualisieren
    - Ändern, wie die Instances-UI Gerätenamen anzeigt
summary: Wie OpenClaw Apple-Gerätemodellkennungen für benutzerfreundliche Namen in der macOS-App einbettet.
title: Gerätemodell-Datenbank
x-i18n:
    generated_at: "2026-04-24T06:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Gerätemodell-Datenbank (benutzerfreundliche Namen)

Die macOS-Begleit-App zeigt in der **Instances**-UI benutzerfreundliche Apple-Gerätemodellnamen an, indem Apple-Modellkennungen (z. B. `iPad16,6`, `Mac16,6`) auf menschenlesbare Namen abgebildet werden.

Die Zuordnung ist als JSON eingebettet unter:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Datenquelle

Wir betten die Zuordnung derzeit aus dem MIT-lizenzierten Repository ein:

- `kyle-seongwoo-jun/apple-device-identifiers`

Um Builds deterministisch zu halten, sind die JSON-Dateien an bestimmte Upstream-Commits angeheftet (aufgezeichnet in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Die Datenbank aktualisieren

1. Wählen Sie die Upstream-Commits aus, die Sie anheften möchten (einen für iOS, einen für macOS).
2. Aktualisieren Sie die Commit-Hashes in `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Laden Sie die JSON-Dateien erneut herunter, angeheftet an diese Commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Stellen Sie sicher, dass `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` weiterhin mit dem Upstream übereinstimmt (ersetzen Sie sie, wenn sich die Upstream-Lizenz ändert).
5. Überprüfen Sie, dass die macOS-App sauber baut (ohne Warnungen):

```bash
swift build --package-path apps/macos
```

## Verwandt

- [Nodes](/de/nodes)
- [Fehlerbehebung für Node](/de/nodes/troubleshooting)
