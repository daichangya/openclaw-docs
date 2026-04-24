---
read_when:
    - Sie möchten Unterstützung für Zalo Personal (inoffiziell) in OpenClaw nutzen
    - Sie konfigurieren oder entwickeln das Plugin `zalouser`
summary: 'Zalo-Personal-Plugin: QR-Login + Messaging über natives `zca-js` (Plugin-Installation + Kanalkonfiguration + Tool)'
title: Zalo-Personal-Plugin
x-i18n:
    generated_at: "2026-04-24T06:52:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Unterstützung für Zalo Personal in OpenClaw über ein Plugin, das natives `zca-js` verwendet, um ein normales Zalo-Benutzerkonto zu automatisieren.

> **Warnung:** Inoffizielle Automatisierung kann zur Sperrung/Bannung des Kontos führen. Nutzung auf eigenes Risiko.

## Benennung

Die Kanal-ID ist `zalouser`, um klarzustellen, dass hier ein **persönliches Zalo-Benutzerkonto** automatisiert wird (inoffiziell). `zalo` bleibt für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## Wo es läuft

Dieses Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie ein Remote-Gateway verwenden, installieren/konfigurieren Sie es auf dem **Rechner, auf dem das Gateway läuft**, und starten Sie das Gateway danach neu.

Es ist keine externe Binärdatei `zca`/`openzca`-CLI erforderlich.

## Installation

### Option A: Installation aus npm

```bash
openclaw plugins install @openclaw/zalouser
```

Starten Sie das Gateway anschließend neu.

### Option B: Installation aus einem lokalen Ordner (Dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie das Gateway anschließend neu.

## Konfiguration

Die Kanalkonfiguration liegt unter `channels.zalouser` (nicht unter `plugins.entries.*`):

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

Kanal-Nachrichtenaktionen unterstützen außerdem `react` für Nachrichtenreaktionen.

## Verwandt

- [Building plugins](/de/plugins/building-plugins)
- [Community plugins](/de/plugins/community)
