---
read_when:
    - Nach Betriebssystemunterstützung oder Installationspfaden suchen
    - Entscheiden, wo das Gateway ausgeführt werden soll
summary: Überblick über die Plattformunterstützung (Gateway + Companion-Apps)
title: Plattformen
x-i18n:
    generated_at: "2026-04-05T12:48:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Plattformen

Der OpenClaw-Core ist in TypeScript geschrieben. **Node ist die empfohlene Laufzeit**.
Bun wird für das Gateway nicht empfohlen (WhatsApp-/Telegram-Bugs).

Companion-Apps gibt es für macOS (Menüleisten-App) und mobile Nodes (iOS/Android). Companion-Apps für Windows und
Linux sind geplant, aber das Gateway wird heute vollständig unterstützt.
Native Companion-Apps für Windows sind ebenfalls geplant; für das Gateway wird WSL2 empfohlen.

## Ihr Betriebssystem wählen

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS & Hosting

- VPS-Hub: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + HTTPS-Proxy): [exe.dev](/install/exe-dev)

## Häufige Links

- Installationsanleitung: [Getting Started](/de/start/getting-started)
- Gateway-Runbook: [Gateway](/gateway)
- Gateway-Konfiguration: [Configuration](/gateway/configuration)
- Dienststatus: `openclaw gateway status`

## Gateway-Dienst installieren (CLI)

Verwenden Sie eine der folgenden Möglichkeiten (alle unterstützt):

- Assistent (empfohlen): `openclaw onboard --install-daemon`
- Direkt: `openclaw gateway install`
- Konfigurationsablauf: `openclaw configure` → **Gateway service** auswählen
- Reparieren/migrieren: `openclaw doctor` (bietet an, den Dienst zu installieren oder zu reparieren)

Das Dienstziel hängt vom Betriebssystem ab:

- macOS: LaunchAgent (`ai.openclaw.gateway` oder `ai.openclaw.<profile>`; Legacy `com.openclaw.*`)
- Linux/WSL2: systemd-User-Service (`openclaw-gateway[-<profile>].service`)
- Natives Windows: Scheduled Task (`OpenClaw Gateway` oder `OpenClaw Gateway (<profile>)`), mit einem Fallback auf einen Login-Eintrag im Startup-Ordner pro Benutzer, wenn die Erstellung der Task verweigert wird
