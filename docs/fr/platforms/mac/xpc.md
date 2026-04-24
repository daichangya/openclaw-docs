---
read_when:
    - modification des contrats IPC ou de l’IPC de l’app de barre de menus
summary: architecture IPC macOS pour l’app OpenClaw, le transport de nœud Gateway et PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-24T07:21:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Architecture IPC macOS d’OpenClaw

**Modèle actuel :** un socket Unix local connecte le **service hôte de nœud** à l’**app macOS** pour les approbations exec et `system.run`. Une CLI de débogage `openclaw-mac` existe pour les vérifications de découverte/connexion ; les actions d’agent passent toujours par le WebSocket Gateway et `node.invoke`. L’automatisation d’interface utilise PeekabooBridge.

## Objectifs

- Une seule instance d’app GUI qui possède tout le travail lié à TCC (notifications, enregistrement d’écran, micro, parole, AppleScript).
- Une petite surface pour l’automatisation : Gateway + commandes de nœud, plus PeekabooBridge pour l’automatisation d’interface.
- Des autorisations prévisibles : toujours le même identifiant de bundle signé, lancé par launchd, afin que les autorisations TCC persistent.

## Fonctionnement

### Gateway + transport de nœud

- L’app exécute la Gateway (mode local) et s’y connecte comme nœud.
- Les actions d’agent sont exécutées via `node.invoke` (par ex. `system.run`, `system.notify`, `canvas.*`).

### Service de nœud + IPC app

- Un service hôte de nœud headless se connecte au WebSocket Gateway.
- Les requêtes `system.run` sont transférées à l’app macOS via un socket Unix local.
- L’app exécute l’exec dans le contexte UI, demande une confirmation si nécessaire et renvoie la sortie.

Diagramme (SCI) :

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatisation d’interface)

- L’automatisation d’interface utilise un socket UNIX distinct nommé `bridge.sock` et le protocole JSON PeekabooBridge.
- Ordre de préférence de l’hôte (côté client) : Peekaboo.app → Claude.app → OpenClaw.app → exécution locale.
- Sécurité : les hôtes du pont exigent un TeamID autorisé ; l’échappatoire même UID uniquement en DEBUG est protégée par `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convention Peekaboo).
- Voir : [utilisation de PeekabooBridge](/fr/platforms/mac/peekaboo) pour les détails.

## Flux opérationnels

- Redémarrage/reconstruction : `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Tue les instances existantes
  - Build Swift + packaging
  - Écrit/initialise/lance le LaunchAgent
- Instance unique : l’app se ferme immédiatement si une autre instance avec le même identifiant de bundle est en cours d’exécution.

## Remarques de durcissement

- Préférez exiger une correspondance de TeamID pour toutes les surfaces privilégiées.
- PeekabooBridge : `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG uniquement) peut autoriser des appelants de même UID pour le développement local.
- Toute la communication reste locale uniquement ; aucun socket réseau n’est exposé.
- Les invites TCC proviennent uniquement du bundle de l’app GUI ; gardez l’identifiant de bundle signé stable entre les reconstructions.
- Durcissement IPC : mode du socket `0600`, jeton, vérifications d’UID pair, défi/réponse HMAC, TTL court.

## Liens associés

- [app macOS](/fr/platforms/macos)
- [Flux IPC macOS (approbations Exec)](/fr/tools/exec-approvals-advanced#macos-ipc-flow)
