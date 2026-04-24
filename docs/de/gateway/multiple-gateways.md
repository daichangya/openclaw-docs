---
read_when:
    - Mehr als ein Gateway auf derselben Maschine ausführen
    - Sie benötigen isolierte Konfiguration/Status/Ports pro Gateway
summary: Mehrere OpenClaw Gateways auf einem Host ausführen (Isolation, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-04-24T06:38:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Mehrere Gateways (derselbe Host)

Die meisten Setups sollten ein Gateway verwenden, da ein einzelnes Gateway mehrere Messaging-Verbindungen und Agenten verwalten kann. Wenn Sie stärkere Isolation oder Redundanz benötigen (z. B. einen Rescue-Bot), führen Sie separate Gateways mit isolierten Profilen/Ports aus.

## Bestes empfohlenes Setup

Für die meisten Benutzer ist das einfachste Rescue-Bot-Setup:

- den Haupt-Bot auf dem Standardprofil belassen
- den Rescue-Bot auf `--profile rescue` ausführen
- für das Rescue-Konto einen vollständig separaten Telegram-Bot verwenden
- den Rescue-Bot auf einem anderen Basis-Port wie `19789` belassen

Dadurch bleibt der Rescue-Bot vom Haupt-Bot isoliert, sodass er
Konfigurationsänderungen debuggen oder anwenden kann, wenn der primäre Bot nicht verfügbar ist. Lassen Sie mindestens 20 Ports Abstand zwischen den
Basis-Ports, damit die abgeleiteten Browser-/Canvas-/CDP-Ports nie kollidieren.

## Schnellstart für den Rescue-Bot

Verwenden Sie dies als Standardpfad, sofern Sie keinen triftigen Grund haben,
etwas anderes zu tun:

```bash
# Rescue-Bot (separater Telegram-Bot, separates Profil, Port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Wenn Ihr Haupt-Bot bereits läuft, ist das normalerweise alles, was Sie brauchen.

Während `openclaw --profile rescue onboard`:

- verwenden Sie das separate Telegram-Bot-Token
- behalten Sie das Profil `rescue`
- verwenden Sie einen Basis-Port, der mindestens 20 höher als der des Haupt-Bots liegt
- akzeptieren Sie den Standard-Workspace für den Rescue-Bot, sofern Sie nicht bereits einen eigenen verwalten

Wenn das Onboarding den Rescue-Service bereits für Sie installiert hat, ist das abschließende
`gateway install` nicht erforderlich.

## Warum das funktioniert

Der Rescue-Bot bleibt unabhängig, weil er Folgendes jeweils separat hat:

- Profil/Konfiguration
- Statusverzeichnis
- Workspace
- Basis-Port (plus abgeleitete Ports)
- Telegram-Bot-Token

Für die meisten Setups verwenden Sie für das Rescue-Profil einen vollständig separaten Telegram-Bot:

- leicht auf nur Operatoren beschränkbar
- separates Bot-Token und separate Identität
- unabhängig von der Kanal-/App-Installation des Haupt-Bots
- einfacher DM-basierter Wiederherstellungspfad, wenn der Haupt-Bot defekt ist

## Was `--profile rescue onboard` ändert

`openclaw --profile rescue onboard` verwendet den normalen Onboarding-Ablauf, aber
schreibt alles in ein separates Profil.

In der Praxis bedeutet das, dass der Rescue-Bot einen eigenen hat:

- Konfigurationsdatei
- Statusverzeichnis
- Workspace (standardmäßig `~/.openclaw/workspace-rescue`)
- Namen des verwalteten Dienstes

Die Prompts sind ansonsten dieselben wie beim normalen Onboarding.

## Allgemeines Multi-Gateway-Setup

Das obige Rescue-Bot-Layout ist der einfachste Standard, aber dasselbe Isolations-
Muster funktioniert für jedes Paar oder jede Gruppe von Gateways auf einem Host.

Für ein allgemeineres Setup geben Sie jedem zusätzlichen Gateway ein eigenes benanntes Profil und seinen
eigenen Basis-Port:

```bash
# main (Standardprofil)
openclaw setup
openclaw gateway --port 18789

# zusätzliches Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Wenn Sie möchten, dass beide Gateways benannte Profile verwenden, funktioniert das ebenfalls:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Dienste folgen demselben Muster:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Verwenden Sie den Schnellstart für den Rescue-Bot, wenn Sie einen Fallback-Pfad für Operatoren möchten. Verwenden Sie das
allgemeine Profilmuster, wenn Sie mehrere langlebige Gateways für
verschiedene Kanäle, Mandanten, Workspaces oder operative Rollen möchten.

## Checkliste zur Isolation

Halten Sie diese Werte pro Gateway-Instanz eindeutig:

- `OPENCLAW_CONFIG_PATH` — Konfigurationsdatei pro Instanz
- `OPENCLAW_STATE_DIR` — Sitzungen, Credentials, Caches pro Instanz
- `agents.defaults.workspace` — Workspace-Root pro Instanz
- `gateway.port` (oder `--port`) — eindeutig pro Instanz
- abgeleitete Browser-/Canvas-/CDP-Ports

Wenn diese geteilt werden, stoßen Sie auf Konfigurations-Race-Conditions und Portkonflikte.

## Portzuordnung (abgeleitet)

Basis-Port = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Browser-Steuerungsdienst-Port = Basis + 2 (nur Loopback)
- Canvas-Host wird auf dem Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`)
- Browser-Profil-CDP-Ports werden automatisch aus `browser.controlPort + 9 .. + 108` zugewiesen

Wenn Sie einen dieser Werte in der Konfiguration oder per Env überschreiben, müssen Sie sie pro Instanz eindeutig halten.

## Hinweise zu Browser/CDP (häufiger Footgun)

- Fixieren Sie `browser.cdpUrl` **nicht** auf dieselben Werte für mehrere Instanzen.
- Jede Instanz benötigt ihren eigenen Browser-Steuerungsport und CDP-Bereich (abgeleitet von ihrem Gateway-Port).
- Wenn Sie explizite CDP-Ports benötigen, setzen Sie `browser.profiles.<name>.cdpPort` pro Instanz.
- Remote-Chrome: Verwenden Sie `browser.profiles.<name>.cdpUrl` (pro Profil, pro Instanz).

## Beispiel mit manuellen Env-Variablen

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Schnelle Prüfungen

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretation:

- `gateway status --deep` hilft, veraltete launchd-/systemd-/schtasks-Dienste aus älteren Installationen zu erkennen.
- Warntext von `gateway probe` wie `multiple reachable gateways detected` ist nur dann zu erwarten, wenn Sie absichtlich mehr als ein isoliertes Gateway ausführen.

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Gateway-Lock](/de/gateway/gateway-lock)
- [Konfiguration](/de/gateway/configuration)
