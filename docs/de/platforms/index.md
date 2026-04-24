---
read_when:
    - Nach OS-Unterstützung oder Installationspfaden suchen
    - Entscheiden, wo das Gateway ausgeführt werden soll
summary: Überblick über die Plattformunterstützung (Gateway + Companion-Apps)
title: Plattformen
x-i18n:
    generated_at: "2026-04-24T06:47:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

Der OpenClaw-Core ist in TypeScript geschrieben. **Node ist die empfohlene Laufzeit**.
Bun wird für das Gateway nicht empfohlen — bekannte Probleme mit WhatsApp- und
Telegram-Kanälen; siehe [Bun (experimentell)](/de/install/bun) für Details.

Companion-Apps existieren für macOS (Menüleisten-App) und mobile Nodes (iOS/Android). Companion-Apps für Windows und
Linux sind geplant, aber das Gateway wird heute bereits vollständig unterstützt.
Native Companion-Apps für Windows sind ebenfalls geplant; für das Gateway wird WSL2 empfohlen.

## Wählen Sie Ihr Betriebssystem

- macOS: [macOS](/de/platforms/macos)
- iOS: [iOS](/de/platforms/ios)
- Android: [Android](/de/platforms/android)
- Windows: [Windows](/de/platforms/windows)
- Linux: [Linux](/de/platforms/linux)

## VPS & Hosting

- VPS-Hub: [VPS-Hosting](/de/vps)
- Fly.io: [Fly.io](/de/install/fly)
- Hetzner (Docker): [Hetzner](/de/install/hetzner)
- GCP (Compute Engine): [GCP](/de/install/gcp)
- Azure (Linux-VM): [Azure](/de/install/azure)
- exe.dev (VM + HTTPS-Proxy): [exe.dev](/de/install/exe-dev)

## Häufige Links

- Installationsleitfaden: [Erste Schritte](/de/start/getting-started)
- Gateway-Runbook: [Gateway](/de/gateway)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Dienststatus: `openclaw gateway status`

## Installation des Gateway-Dienstes (CLI)

Verwenden Sie eine der folgenden Optionen (alle werden unterstützt):

- Assistent (empfohlen): `openclaw onboard --install-daemon`
- Direkt: `openclaw gateway install`
- Configure-Ablauf: `openclaw configure` → **Gateway service** auswählen
- Reparieren/Migrieren: `openclaw doctor` (bietet an, den Dienst zu installieren oder zu reparieren)

Das Dienstziel hängt vom Betriebssystem ab:

- macOS: LaunchAgent (`ai.openclaw.gateway` oder `ai.openclaw.<profile>`; Legacy `com.openclaw.*`)
- Linux/WSL2: systemd-Benutzerdienst (`openclaw-gateway[-<profile>].service`)
- Natives Windows: Scheduled Task (`OpenClaw Gateway` oder `OpenClaw Gateway (<profile>)`), mit einem Fallback auf ein Login-Element im Startup-Ordner pro Benutzer, wenn die Erstellung der Aufgabe verweigert wird

## Verwandt

- [Installationsüberblick](/de/install)
- [macOS-App](/de/platforms/macos)
- [iOS-App](/de/platforms/ios)
