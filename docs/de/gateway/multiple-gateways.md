---
read_when:
    - Mehr als ein Gateway auf demselben Rechner ausführen
    - Sie benötigen isolierte Konfiguration, isolierten Status und isolierte Ports pro Gateway
summary: Mehrere OpenClaw Gateways auf einem Host ausführen (Isolation, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-04-21T17:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Mehrere Gateways (derselbe Host)

Die meisten Setups sollten ein Gateway verwenden, weil ein einzelnes Gateway mehrere Messaging-Verbindungen und Agents verarbeiten kann. Wenn Sie stärkere Isolation oder Redundanz benötigen, z. B. einen Rescue-Bot, führen Sie separate Gateways mit isolierten Profilen und Ports aus.

## Checkliste für die Isolation (erforderlich)

- `OPENCLAW_CONFIG_PATH` — Konfigurationsdatei pro Instanz
- `OPENCLAW_STATE_DIR` — Sitzungen, Anmeldedaten und Caches pro Instanz
- `agents.defaults.workspace` — Workspace-Stammverzeichnis pro Instanz
- `gateway.port` (oder `--port`) — eindeutig pro Instanz
- Abgeleitete Ports (Browser/Canvas) dürfen sich nicht überschneiden

Wenn diese gemeinsam genutzt werden, kommt es zu Konfigurations-Race-Conditions und Portkonflikten.

## Empfohlen: Verwenden Sie das Standardprofil für das Hauptsystem und ein benanntes Profil für Rescue

Profile grenzen `OPENCLAW_STATE_DIR` und `OPENCLAW_CONFIG_PATH` automatisch ab und hängen Suffixe an Dienstnamen an. Für die meisten Rescue-Bot-Setups sollten Sie den Haupt-Bot im Standardprofil belassen und nur dem Rescue-Bot ein benanntes Profil wie `rescue` geben.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Dienste:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Wenn Sie möchten, dass beide Gateways benannte Profile verwenden, funktioniert das ebenfalls, ist aber nicht erforderlich.

## Leitfaden für Rescue-Bots

Empfohlenes Setup:

- den Haupt-Bot im Standardprofil belassen
- den Rescue-Bot mit `--profile rescue` ausführen
- für das Rescue-Konto einen vollständig separaten Telegram-Bot verwenden
- den Rescue-Bot auf einem anderen Basisport wie `19001` betreiben

Dadurch bleibt der Rescue-Bot vom Haupt-Bot isoliert, sodass er Konfigurationsänderungen debuggen oder anwenden kann, wenn der primäre Bot ausgefallen ist. Lassen Sie zwischen den Basisports mindestens 20 Ports Abstand, damit sich die abgeleiteten Browser-/Canvas-/CDP-Ports niemals überschneiden.

### Empfohlener Rescue-Kanal/-Account

Verwenden Sie für die meisten Setups einen vollständig separaten Telegram-Bot für das Rescue-Profil.

Warum Telegram:

- leicht auf reine Operator-Nutzung beschränkbar
- separates Bot-Token und separate Identität
- unabhängig von der Kanal-/App-Installation des Haupt-Bots
- einfacher DM-basierter Wiederherstellungspfad, wenn der Haupt-Bot defekt ist

Wichtig ist die vollständige Unabhängigkeit: separates Bot-Konto, separate Anmeldedaten, separates OpenClaw-Profil, separater Workspace und separater Port.

### Empfohlener Installationsablauf

Verwenden Sie dies als Standard-Setup, sofern Sie keinen triftigen Grund haben, etwas anderes zu tun:

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Während `openclaw --profile rescue onboard`:

- verwenden Sie das separate Telegram-Bot-Token
- behalten Sie das Profil `rescue` bei
- verwenden Sie einen Basisport, der mindestens 20 höher ist als der des Haupt-Bots
- übernehmen Sie den Standard-Workspace für Rescue, sofern Sie nicht bereits selbst einen verwalten

Wenn das Onboarding den Rescue-Dienst bereits für Sie installiert hat, ist das abschließende `gateway install` nicht erforderlich.

### Was das Onboarding ändert

`openclaw --profile rescue onboard` verwendet den normalen Onboarding-Ablauf, schreibt aber alles in ein separates Profil.

In der Praxis bedeutet das, dass der Rescue-Bot Folgendes erhält:

- eine eigene Konfigurationsdatei
- ein eigenes Statusverzeichnis
- einen eigenen Workspace (standardmäßig `~/.openclaw/workspace-rescue`)
- einen eigenen Namen für den verwalteten Dienst

Die Eingabeaufforderungen sind ansonsten dieselben wie beim normalen Onboarding.

## Portzuordnung (abgeleitet)

Basisport = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Browser-Steuerungsdienst-Port = Basisport + 2 (nur loopback)
- Canvas Host wird über den Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`)
- CDP-Ports für Browser-Profile werden automatisch aus `browser.controlPort + 9 .. + 108` zugewiesen

Wenn Sie einen dieser Werte in der Konfiguration oder per Umgebungsvariable überschreiben, müssen sie pro Instanz eindeutig bleiben.

## Hinweise zu Browser/CDP (häufige Fehlerquelle)

- Legen Sie `browser.cdpUrl` auf mehreren Instanzen **nicht** auf dieselben Werte fest.
- Jede Instanz benötigt ihren eigenen Browser-Steuerungsport und ihren eigenen CDP-Bereich (abgeleitet von ihrem Gateway-Port).
- Wenn Sie explizite CDP-Ports benötigen, setzen Sie `browser.profiles.<name>.cdpPort` pro Instanz.
- Remote-Chrome: Verwenden Sie `browser.profiles.<name>.cdpUrl` (pro Profil, pro Instanz).

## Beispiel für manuelle Umgebungsvariablen

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
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

- `gateway status --deep` hilft dabei, veraltete launchd-/systemd-/schtasks-Dienste aus älteren Installationen zu erkennen.
- Warntexte von `gateway probe` wie `multiple reachable gateways detected` sind nur dann erwartbar, wenn Sie absichtlich mehr als ein isoliertes Gateway ausführen.
