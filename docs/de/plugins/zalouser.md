---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw
    - Sie konfigurieren oder entwickeln das `zalouser`-Plugin
summary: 'Zalo-Personal-Plugin: QR-Login + Nachrichtenversand über natives `zca-js` (Plugin-Installation + Kanal-Konfiguration + Tool)'
title: Zalo Personal Plugin
x-i18n:
    generated_at: "2026-04-05T12:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Zalo-Personal-Unterstützung für OpenClaw über ein Plugin, das natives `zca-js` verwendet, um ein normales persönliches Zalo-Benutzerkonto zu automatisieren.

> **Warnung:** Inoffizielle Automatisierung kann zur Sperrung/Blockierung des Kontos führen. Verwendung auf eigene Gefahr.

## Benennung

Die Kanal-ID ist `zalouser`, um ausdrücklich klarzumachen, dass hier ein **persönliches Zalo-Benutzerkonto** (inoffiziell) automatisiert wird. `zalo` bleibt für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## Wo es ausgeführt wird

Dieses Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt.

Wenn Sie ein Remote-Gateway verwenden, installieren/konfigurieren Sie es auf dem **Rechner, auf dem das Gateway läuft**, und starten Sie dann das Gateway neu.

Es wird keine externe `zca`-/`openzca`-CLI-Binärdatei benötigt.

## Installation

### Option A: aus npm installieren

```bash
openclaw plugins install @openclaw/zalouser
```

Starten Sie anschließend das Gateway neu.

### Option B: aus einem lokalen Ordner installieren (Entwicklung)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie anschließend das Gateway neu.

## Konfiguration

Die Kanal-Konfiguration befindet sich unter `channels.zalouser` (nicht unter `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent-Tool

Tool-Name: `zalouser`

Aktionen: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Kanal-Nachrichtenaktionen unterstützen auch `react` für Nachrichtenreaktionen.
