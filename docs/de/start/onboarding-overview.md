---
read_when:
    - Einen Onboarding-Pfad auswählen
    - Eine neue Umgebung einrichten
sidebarTitle: Onboarding Overview
summary: Überblick über Onboarding-Optionen und -Abläufe von OpenClaw
title: Onboarding-Überblick
x-i18n:
    generated_at: "2026-04-24T07:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw hat zwei Onboarding-Pfade. Beide konfigurieren Authentifizierung, das Gateway und
optionale Chat-Kanäle — sie unterscheiden sich nur darin, wie Sie mit dem Setup interagieren.

## Welchen Pfad sollte ich verwenden?

|                | CLI-Onboarding                         | Onboarding in der macOS-App |
| -------------- | -------------------------------------- | --------------------------- |
| **Plattformen** | macOS, Linux, Windows (nativ oder WSL2) | nur macOS                  |
| **Oberfläche** | Terminal-Assistent                     | Geführte UI in der App      |
| **Am besten für** | Server, Headless, volle Kontrolle    | Desktop-Mac, visuelles Setup |
| **Automatisierung** | `--non-interactive` für Skripte    | Nur manuell                 |
| **Befehl**     | `openclaw onboard`                     | App starten                 |

Die meisten Benutzer sollten mit **CLI-Onboarding** beginnen — es funktioniert überall und gibt
Ihnen die meiste Kontrolle.

## Was das Onboarding konfiguriert

Unabhängig davon, welchen Pfad Sie wählen, richtet das Onboarding Folgendes ein:

1. **Modell-Provider und Authentifizierung** — API-Schlüssel, OAuth oder Setup-Token für Ihren gewählten Provider
2. **Workspace** — Verzeichnis für Agent-Dateien, Bootstrap-Vorlagen und Memory
3. **Gateway** — Port, Bind-Adresse, Auth-Modus
4. **Kanäle** (optional) — integrierte und gebündelte Chat-Kanäle wie
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp und mehr
5. **Daemon** (optional) — Hintergrunddienst, damit das Gateway automatisch startet

## CLI-Onboarding

In einem beliebigen Terminal ausführen:

```bash
openclaw onboard
```

Fügen Sie `--install-daemon` hinzu, um den Hintergrunddienst ebenfalls in einem Schritt zu installieren.

Vollständige Referenz: [Onboarding (CLI)](/de/start/wizard)
CLI-Befehlsdokumentation: [`openclaw onboard`](/de/cli/onboard)

## Onboarding in der macOS-App

Öffnen Sie die OpenClaw-App. Der Assistent beim ersten Start führt Sie mit einer
visuellen Oberfläche durch dieselben Schritte.

Vollständige Referenz: [Onboarding (macOS App)](/de/start/onboarding)

## Benutzerdefinierte oder nicht aufgeführte Provider

Wenn Ihr Provider im Onboarding nicht aufgeführt ist, wählen Sie **Custom Provider** und
geben Sie Folgendes ein:

- API-Kompatibilitätsmodus (OpenAI-kompatibel, Anthropic-kompatibel oder automatische Erkennung)
- Base-URL und API-Schlüssel
- Modell-ID und optionaler Alias

Mehrere benutzerdefinierte Endpunkte können nebeneinander existieren — jeder erhält eine eigene Endpoint-ID.

## Verwandt

- [Getting started](/de/start/getting-started)
- [CLI setup reference](/de/start/wizard-cli-reference)
