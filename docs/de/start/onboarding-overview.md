---
read_when:
    - Beim Auswählen eines Onboarding-Pfads
    - Beim Einrichten einer neuen Umgebung
sidebarTitle: Onboarding Overview
summary: Überblick über Onboarding-Optionen und -Abläufe von OpenClaw
title: Onboarding-Überblick
x-i18n:
    generated_at: "2026-04-05T12:55:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Onboarding-Überblick

OpenClaw hat zwei Onboarding-Pfade. Beide konfigurieren Authentifizierung, das Gateway und
optionale Chat-Kanäle — sie unterscheiden sich nur darin, wie Sie mit dem Setup interagieren.

## Welchen Pfad sollte ich verwenden?

|                | CLI-Onboarding                         | macOS-App-Onboarding      |
| -------------- | -------------------------------------- | ------------------------- |
| **Plattformen**  | macOS, Linux, Windows (nativ oder WSL2) | nur macOS                |
| **Oberfläche**  | Terminal-Wizard                        | Geführte UI in der App      |
| **Am besten geeignet für**   | Server, Headless, vollständige Kontrolle        | Desktop-Mac, visuelles Setup |
| **Automatisierung** | `--non-interactive` für Skripte        | nur manuell               |
| **Befehl**    | `openclaw onboard`                     | App starten            |

Die meisten Benutzer sollten mit dem **CLI-Onboarding** beginnen — es funktioniert überall und gibt
Ihnen die meiste Kontrolle.

## Was Onboarding konfiguriert

Unabhängig davon, welchen Pfad Sie wählen, richtet Onboarding Folgendes ein:

1. **Modell-Provider und Authentifizierung** — API-Schlüssel, OAuth oder Setup-Token für Ihren gewählten Provider
2. **Workspace** — Verzeichnis für Agent-Dateien, Bootstrap-Vorlagen und Gedächtnis
3. **Gateway** — Port, Bind-Adresse, Authentifizierungsmodus
4. **Kanäle** (optional) — integrierte und gebündelte Chat-Kanäle wie
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp und weitere
5. **Daemon** (optional) — Hintergrunddienst, damit das Gateway automatisch startet

## CLI-Onboarding

In einem beliebigen Terminal ausführen:

```bash
openclaw onboard
```

Fügen Sie `--install-daemon` hinzu, um den Hintergrunddienst ebenfalls in einem Schritt zu installieren.

Vollständige Referenz: [Onboarding (CLI)](/de/start/wizard)
CLI-Befehlsdokumentation: [`openclaw onboard`](/cli/onboard)

## macOS-App-Onboarding

Öffnen Sie die OpenClaw-App. Der Ersteinrichtungs-Wizard führt Sie mit einer visuellen Oberfläche durch dieselben Schritte.

Vollständige Referenz: [Onboarding (macOS-App)](/start/onboarding)

## Benutzerdefinierte oder nicht aufgeführte Provider

Wenn Ihr Provider im Onboarding nicht aufgeführt ist, wählen Sie **Custom Provider** und
geben Sie Folgendes ein:

- API-Kompatibilitätsmodus (OpenAI-kompatibel, Anthropic-kompatibel oder automatische Erkennung)
- Basis-URL und API-Schlüssel
- Modell-ID und optionalen Alias

Mehrere benutzerdefinierte Endpunkte können nebeneinander bestehen — jeder erhält eine eigene Endpunkt-ID.
