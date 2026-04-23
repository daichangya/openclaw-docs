---
read_when:
    - Vous devez capturer localement le trafic de transport OpenClaw pour le débogage
    - Vous souhaitez inspecter les sessions du proxy de débogage, les blobs ou les préréglages de requête intégrés
summary: Référence CLI pour `openclaw proxy`, le proxy de débogage local et l’inspecteur de capture
title: proxy
x-i18n:
    generated_at: "2026-04-23T13:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Exécutez le proxy de débogage explicite local et inspectez le trafic capturé.

Il s’agit d’une commande de débogage pour l’investigation au niveau du transport. Elle peut démarrer un
proxy local, exécuter une commande enfant avec la capture activée, lister les sessions de capture,
interroger des motifs de trafic courants, lire des blobs capturés et purger les données
de capture locales.

## Commandes

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Préréglages de requête

`openclaw proxy query --preset <name>` accepte :

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Remarques

- `start` utilise `127.0.0.1` par défaut sauf si `--host` est défini.
- `run` démarre un proxy de débogage local puis exécute la commande après `--`.
- Les captures sont des données de débogage locales ; utilisez `openclaw proxy purge` une fois terminé.
