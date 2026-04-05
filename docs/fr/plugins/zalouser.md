---
read_when:
    - Vous souhaitez une prise en charge de Zalo Personal (non officielle) dans OpenClaw
    - Vous configurez ou développez le plugin zalouser
summary: 'Plugin Zalo Personal : connexion QR + messagerie via `zca-js` natif (installation du plugin + configuration du canal + outil)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-05T12:50:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Prise en charge de Zalo Personal pour OpenClaw via un plugin, en utilisant `zca-js` natif pour automatiser un compte utilisateur Zalo normal.

> **Warning:** Une automatisation non officielle peut entraîner la suspension/le bannissement du compte. Utilisez-la à vos risques.

## Nommage

L’identifiant du canal est `zalouser` afin d’indiquer explicitement qu’il automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` pour une éventuelle future intégration officielle de l’API Zalo.

## Où il s’exécute

Ce plugin s’exécute **dans le processus Gateway**.

Si vous utilisez une Gateway distante, installez/configurez-le sur la **machine qui exécute la Gateway**, puis redémarrez la Gateway.

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Installer

### Option A : installer depuis npm

```bash
openclaw plugins install @openclaw/zalouser
```

Redémarrez ensuite la Gateway.

### Option B : installer depuis un dossier local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite la Gateway.

## Configuration

La configuration du canal se trouve sous `channels.zalouser` (et non `plugins.entries.*`) :

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

## Outil d’agent

Nom de l’outil : `zalouser`

Actions : `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Les actions de message de canal prennent aussi en charge `react` pour les réactions aux messages.
