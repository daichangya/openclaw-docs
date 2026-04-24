---
read_when:
    - Héberger PeekabooBridge dans OpenClaw.app
    - Intégrer Peekaboo via Swift Package Manager
    - Modifier le protocole/les chemins de PeekabooBridge
summary: Intégration de PeekabooBridge pour l’automatisation de l’interface macOS
title: Bridge Peekaboo
x-i18n:
    generated_at: "2026-04-24T07:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw peut héberger **PeekabooBridge** comme broker local d’automatisation d’interface, sensible aux permissions. Cela permet au CLI `peekaboo` de piloter l’automatisation d’interface tout en réutilisant les permissions TCC de l’application macOS.

## Ce que c’est (et ce que ce n’est pas)

- **Hôte** : OpenClaw.app peut agir comme hôte PeekabooBridge.
- **Client** : utilisez le CLI `peekaboo` (pas de surface séparée `openclaw ui ...`).
- **Interface** : les overlays visuels restent dans Peekaboo.app ; OpenClaw est un hôte broker léger.

## Activer le bridge

Dans l’application macOS :

- Réglages → **Enable Peekaboo Bridge**

Lorsqu’il est activé, OpenClaw démarre un serveur de socket UNIX local. S’il est désactivé, l’hôte
est arrêté et `peekaboo` retombera sur d’autres hôtes disponibles.

## Ordre de discovery du client

Les clients Peekaboo essaient généralement les hôtes dans cet ordre :

1. Peekaboo.app (UX complète)
2. Claude.app (si installée)
3. OpenClaw.app (broker léger)

Utilisez `peekaboo bridge status --verbose` pour voir quel hôte est actif et quel
chemin de socket est utilisé. Vous pouvez remplacer cela avec :

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sécurité et permissions

- Le bridge valide les **signatures de code des appelants** ; une liste blanche de TeamID est
  appliquée (TeamID de l’hôte Peekaboo + TeamID de l’application OpenClaw).
- Les requêtes expirent après environ 10 secondes.
- Si des permissions requises sont absentes, le bridge renvoie un message d’erreur clair
  au lieu d’ouvrir Réglages Système.

## Comportement des instantanés (automatisation)

Les instantanés sont stockés en mémoire et expirent automatiquement après une courte durée.
Si vous avez besoin d’une conservation plus longue, refaites une capture depuis le client.

## Dépannage

- Si `peekaboo` signale « bridge client is not authorized », assurez-vous que le client est
  correctement signé ou exécutez l’hôte avec `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  en mode **debug** uniquement.
- Si aucun hôte n’est trouvé, ouvrez l’une des applications hôtes (Peekaboo.app ou OpenClaw.app)
  et confirmez que les permissions sont accordées.

## Lié

- [Application macOS](/fr/platforms/macos)
- [Permissions macOS](/fr/platforms/mac/permissions)
