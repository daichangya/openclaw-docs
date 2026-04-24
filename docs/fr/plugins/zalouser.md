---
read_when:
    - Vous voulez la prise en charge de Zalo Personal (non officiel) dans OpenClaw
    - Vous configurez ou développez le plugin zalouser
summary: 'Plugin Zalo Personal : connexion par QR + messagerie via le `zca-js` natif (installation du plugin + configuration du canal + outil)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-24T07:25:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Prise en charge de Zalo Personal pour OpenClaw via un plugin, utilisant le `zca-js` natif pour automatiser un compte utilisateur Zalo normal.

> **Avertissement :** L’automatisation non officielle peut entraîner la suspension/le bannissement du compte. Utilisez-la à vos risques et périls.

## Nommage

L’ID du canal est `zalouser` pour indiquer explicitement qu’il automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` à une éventuelle future intégration officielle de l’API Zalo.

## Où il s’exécute

Ce plugin s’exécute **dans le processus Gateway**.

Si vous utilisez un Gateway distant, installez/configurez-le sur la **machine qui exécute le Gateway**, puis redémarrez le Gateway.

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Installation

### Option A : installation depuis npm

```bash
openclaw plugins install @openclaw/zalouser
```

Redémarrez ensuite le Gateway.

### Option B : installation depuis un dossier local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite le Gateway.

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

## Associé

- [Créer des plugins](/fr/plugins/building-plugins)
- [Plugins communautaires](/fr/plugins/community)
