---
read_when:
    - Hébergement de PeekabooBridge dans OpenClaw.app
    - Intégration de Peekaboo via Swift Package Manager
    - Modification du protocole/des chemins PeekabooBridge
summary: Intégration de PeekabooBridge pour l’automatisation d’interface macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T12:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (automatisation d’interface macOS)

OpenClaw peut héberger **PeekabooBridge** comme courtier local d’automatisation d’interface tenant compte des autorisations. Cela permet à la CLI `peekaboo` de piloter l’automatisation de l’interface tout en réutilisant les autorisations TCC de l’app macOS.

## Ce que c’est (et ce que ce n’est pas)

- **Hôte** : OpenClaw.app peut agir comme hôte PeekabooBridge.
- **Client** : utilisez la CLI `peekaboo` (pas de surface `openclaw ui ...` distincte).
- **Interface** : les surcouches visuelles restent dans Peekaboo.app ; OpenClaw est un hôte courtier léger.

## Activer le bridge

Dans l’app macOS :

- Réglages → **Enable Peekaboo Bridge**

Lorsqu’il est activé, OpenClaw démarre un serveur local de socket UNIX. S’il est désactivé, l’hôte est arrêté et `peekaboo` retombera sur d’autres hôtes disponibles.

## Ordre de découverte des clients

Les clients Peekaboo essaient généralement les hôtes dans cet ordre :

1. Peekaboo.app (expérience complète)
2. Claude.app (si installée)
3. OpenClaw.app (courtier léger)

Utilisez `peekaboo bridge status --verbose` pour voir quel hôte est actif et quel chemin de socket est utilisé. Vous pouvez remplacer cela avec :

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sécurité et autorisations

- Le bridge valide les **signatures de code des appelants** ; une liste d’autorisation de TeamID est appliquée (TeamID de l’hôte Peekaboo + TeamID de l’app OpenClaw).
- Les requêtes expirent après ~10 secondes.
- Si les autorisations requises sont absentes, le bridge renvoie un message d’erreur clair au lieu de lancer Réglages Système.

## Comportement des instantanés (automatisation)

Les instantanés sont stockés en mémoire et expirent automatiquement après une courte durée.
Si vous avez besoin d’une conservation plus longue, recapturez-les depuis le client.

## Dépannage

- Si `peekaboo` signale « bridge client is not authorized », assurez-vous que le client est correctement signé ou exécutez l’hôte avec `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` en mode **debug** uniquement.
- Si aucun hôte n’est trouvé, ouvrez l’une des apps hôtes (Peekaboo.app ou OpenClaw.app) et confirmez que les autorisations sont accordées.
