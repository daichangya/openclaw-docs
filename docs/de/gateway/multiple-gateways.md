---
read_when:
    - Mehr als ein Gateway auf demselben Rechner ausführen
    - Sie benötigen isolierte Konfiguration/isolierten Status/eigene Ports pro Gateway
summary: Mehrere OpenClaw-Gateways auf einem Host ausführen (Isolierung, Ports und Profile)
title: Mehrere Gateways
x-i18n:
    generated_at: "2026-04-05T12:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Mehrere Gateways (derselbe Host)

Die meisten Setups sollten ein einzelnes Gateway verwenden, da ein einziges Gateway mehrere Messaging-Verbindungen und Agenten verwalten kann. Wenn Sie eine stärkere Isolierung oder Redundanz benötigen (z. B. einen Rettungs-Bot), führen Sie separate Gateways mit isolierten Profilen/Ports aus.

## Checkliste zur Isolierung (erforderlich)

- `OPENCLAW_CONFIG_PATH` — Konfigurationsdatei pro Instanz
- `OPENCLAW_STATE_DIR` — Sitzungen, Anmeldedaten und Caches pro Instanz
- `agents.defaults.workspace` — Workspace-Root pro Instanz
- `gateway.port` (oder `--port`) — eindeutiger Port pro Instanz
- Abgeleitete Ports (Browser/Canvas) dürfen sich nicht überschneiden

Wenn diese gemeinsam genutzt werden, treten Konfigurationsrennen und Portkonflikte auf.

## Empfohlen: Profile (`--profile`)

Profile grenzen `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` automatisch ab und hängen Suffixe an Servicenamen an.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Dienste pro Profil:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Leitfaden für Rettungs-Bot

Führen Sie ein zweites Gateway auf demselben Host mit eigenem Folgendem aus:

- Profil/Konfiguration
- Statusverzeichnis
- Workspace
- Basisport (plus abgeleitete Ports)

So bleibt der Rettungs-Bot vom Haupt-Bot isoliert, sodass er Fehler analysieren oder Konfigurationsänderungen anwenden kann, wenn der primäre Bot nicht verfügbar ist.

Portabstand: Lassen Sie zwischen den Basisports mindestens 20 Ports frei, damit sich die abgeleiteten Browser-/Canvas-/CDP-Ports nie überschneiden.

### Installation (Rettungs-Bot)

```bash
# Haupt-Bot (bestehend oder neu, ohne --profile-Parameter)
# Läuft auf Port 18789 + Chrome-CDC-/Canvas-/...-Ports
openclaw onboard
openclaw gateway install

# Rettungs-Bot (isoliertes Profil + Ports)
openclaw --profile rescue onboard
# Hinweise:
# - der Workspace-Name erhält standardmäßig das Suffix -rescue
# - der Port sollte mindestens 18789 + 20 Ports sein,
#   besser einen völlig anderen Basisport wählen, z. B. 19789,
# - der Rest des Onboardings ist derselbe wie normal

# Um den Dienst zu installieren (falls dies nicht bereits während des Setups automatisch passiert ist)
openclaw --profile rescue gateway install
```

## Portzuordnung (abgeleitet)

Basisport = `gateway.port` (oder `OPENCLAW_GATEWAY_PORT` / `--port`).

- Browser-Control-Service-Port = Basisport + 2 (nur loopback)
- Der Canvas-Host wird auf dem Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`)
- Browser-Profil-CDP-Ports werden automatisch aus `browser.controlPort + 9 .. + 108` zugewiesen

Wenn Sie einen dieser Werte in config oder env überschreiben, müssen Sie sie pro Instanz eindeutig halten.

## Hinweise zu Browser/CDP (häufige Stolperfalle)

- Setzen Sie `browser.cdpUrl` **nicht** auf mehreren Instanzen auf dieselben Werte fest.
- Jede Instanz benötigt ihren eigenen Browser-Control-Port und ihren eigenen CDP-Bereich (abgeleitet aus ihrem Gateway-Port).
- Wenn Sie explizite CDP-Ports benötigen, setzen Sie `browser.profiles.<name>.cdpPort` pro Instanz.
- Remote-Chrome: Verwenden Sie `browser.profiles.<name>.cdpUrl` (pro Profil, pro Instanz).

## Beispiel mit manuellen Env vars

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Schnelle Prüfungen

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretation:

- `gateway status --deep` hilft dabei, veraltete launchd-/systemd-/schtasks-Dienste aus älteren Installationen zu erkennen.
- Warntexte von `gateway probe` wie `multiple reachable gateways detected` sind nur dann zu erwarten, wenn Sie absichtlich mehr als ein isoliertes Gateway ausführen.
